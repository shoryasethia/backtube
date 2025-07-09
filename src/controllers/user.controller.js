import asyncHandler from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
  // take user data from frontend
  // check the given data is valid/not empty. check isPasswordCorrect?
  // check user already exist? use email, username
  // take avatar.
  // upload to cloudinary, check is avatar uploaded?
  // create User object - create entry in db
  // remove password and refresh token from response 
  // check for user created or not, return this response  

  const {userName, email, fullName, password} = req.body

  if(
    [fullName, email, password, userName].some((field) => (field?.trim()===""))
  ){
    throw new ApiError(400, `All fields are required.`)
  }

  const existingUser = User.findOne({
    $or: [{ email }, { userName }]
  })

  if(existingUser){
    throw new ApiError(409, `User with same email or username already exists.`)
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400, `Avatar is required.`)
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, `Avatar is required.`)
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
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

export {registerUser}