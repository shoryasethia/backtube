import { Router } from "express";
import { 
  loginUser, 
  logoutUser, 
  registerUser, 
  refreshAccessToken, 
  changeCurrentUserPassword, 
  getCurrentUser, 
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";

import { upload, uploadSingleAvatar, uploadSingleCoverImage } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    }
  ]),
  registerUser
)

userRouter.route("/login").post(upload.none(), loginUser)

// secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(verifyJWT, upload.none(), changeCurrentUserPassword)
userRouter.route("/current-user").get(verifyJWT,getCurrentUser)
userRouter.route("/change-avatar").patch(
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
)

userRouter.route("/change-cover").patch(
  verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage
)

userRouter.route("/change-account-details").patch(
  verifyJWT,
  upload.none(),
  updateAccountDetails
)

userRouter.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
userRouter.route("/history").get(verifyJWT, getWatchHistory)

export default userRouter