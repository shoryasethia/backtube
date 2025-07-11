import asyncHandler from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { 
  validateRequiredFields, 
  validateEmail, 
  validateUsername, 
  validatePassword, 
  validateFullName 
} from "../utils/validations.js";
import jwt  from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {

    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return {
      accessToken,
      refreshToken
    }
  } catch (error) {
    throw new ApiError(500, `Something went wrong while generating refresh and access tokens`)
  }
}

const registerUser = asyncHandler(async (req,res) => {
  // take user data from frontend
  // check the given data is valid/not empty. check isPasswordCorrect?
  // check user already exist? use email, username
  // take avatar.
  // upload to cloudinary, check is avatar uploaded?
  // create User object - create entry in db
  // remove password and refresh token from response 
  // check for user created or not, return this response  

  const {username, email, fullName, password} = req.body

  // Validate required fields
  validateRequiredFields([username, email, fullName, password], ['username', 'email', 'fullName', 'password']);
  
  // Validate individual fields
  validateEmail(email);
  validateUsername(username);
  validatePassword(password);
  validateFullName(fullName);

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  })

  if(existingUser){
    throw new ApiError(409, `User with same email or username already exists.`)
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, `Avatar is required.`)
  } 

  const user = await User.create({
    username: username.toLowerCase(),
    fullName: fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email,
    password: password
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, `Something went wrong while registering new user.`)
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, `User registered successfully.`)
  )

})

const loginUser = asyncHandler( async (req,res) => {
  // get details from user from req.body
  // check if user exists via username or email, if not raise error
  // if exist, check password, if mismatch raise error
  // update the refresh token and its expiry.
  // send response to user as well (cookie)

  const {username, email, password} = req.body

  if(!username && !email){
    throw new ApiError(400, `Username or email is required.`)
  }

  if(!password){
    throw new ApiError(400, `Password is required.`)
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if(!user){
    throw new ApiError(404, `User does not exist.`)
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  
  if(!isPasswordValid){
    throw new ApiError(401, `Invalid user credentials.`)
  }

  const {accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const options = {
    httpOnly: true,
    secure: true
  }

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(200,
      {
        user: loggedInUser,
        accessToken: accessToken,
        refreshToken: refreshToken
      },
      "User logged in successfully"
    )
  )

})

const logoutUser = asyncHandler( async (req,res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200,{},"User logged out."))
})

const refreshAccessToken = asyncHandler (async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request.")
  }

  try {
    const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedRefreshToken._id)
  
    if(!user){
      throw new ApiError(401, "Invalid Refresh token.")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used.")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const { accessToken: newAccessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(decodedRefreshToken._id)
  
    return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(200, 
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }, 
      "Access token refreshed."
    ))
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const changeCurrentUserPassword = asyncHandler (async (req,res) => {
  const {oldPassword, newPassword, confirmNewPassword} = req.body

  if(newPassword !== confirmNewPassword){
    throw new ApiError(400, `New password and confirm password do not match.`)
  }

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password.")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "Password updated successfully."
  ))
})

const getCurrentUser = asyncHandler (async (req,res) => {
  if(!req.user){
    throw new ApiError(401, "User not found.")
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    req.user,
    "Current user fetched successfully."
  ))
})

const updateAccountDetails = asyncHandler (async (req,res) => {
  const {fullName, email} = req.body

  if(!fullName && !email){
    throw new ApiError(400, "Fullname and email are required.")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName: fullName,
        email: email
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json( new ApiResponse(
    200,
    user,
    "Account details updated successfully."
  ))
})

const updateUserAvatar = asyncHandler (async (req,res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing.")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar){
    throw new ApiError(400, "Error while uploading avatar on cloudinary.")
  }

  const user = await User.findById(req.user?._id)
  const oldAvatarUrl = user.avatar

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  let deletionMessage = null;
  if(oldAvatarUrl) {
    try {
      await deleteFromCloudinary(oldAvatarUrl);
      deletionMessage = "Old avatar deleted successfully from cloudinary";
    } catch (deleteError) {
      deletionMessage = `Failed to delete old avatar: ${deleteError.message}`;
    }
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {
      user: updatedUser,
      deletionStatus: deletionMessage
    },
    "Avatar updated successfully."
  ))
})

const updateUserCoverImage = asyncHandler (async (req,res) => {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image file is missing.")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage){
    throw new ApiError(400, "Error while uploading cover image on cloudinary.")
  }

  const user = await User.findById(req.user?._id)
  const oldCoverImageUrl = user.coverImage

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  let deletionMessage = null;
  if (oldCoverImageUrl) {
    try {
      await deleteFromCloudinary(oldCoverImageUrl);
      deletionMessage = "Old cover image deleted successfully from cloudinary";
    } catch (deleteError) {
      deletionMessage = `Failed to delete old cover image: ${deleteError.message}`;
    }
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {
      user: updatedUser,
      deletionStatus: deletionMessage
    },
    "Cover image updated successfully."
  ))
})

const getUserChannelProfile = asyncHandler (async (req,res) => {
  const { username }  = req.params

  if(!username?.trim()){
    throw new ApiError(400, "Username is missing.")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404, "Channel does not exist.")
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    channel[0],
    "User channel fetched successfully."
  ))
})

const getWatchHistory = asyncHandler (async (req,res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  }
                }
              ]
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    user[0].watchHistory,
    "Watch History fetched successfully."
  ))
})

export {
  registerUser, 
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}