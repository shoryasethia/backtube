import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage }) 

// Single file upload functions
export const uploadSingleAvatar = upload.single("avatar")
export const uploadSingleCoverImage = upload.single("coverImage") 