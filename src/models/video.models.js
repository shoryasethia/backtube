import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    videoFile:{
      type: String, // cloudinary url
      required: true,
    },
    thumbnail:{
      type: String, // cloudinary url
      required: true,
    },
    owner:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title:{
      type: String, 
      required: true,
    },
    description:{
      type: String,
      required: true,
    },
    duration:{
      type: Number,
      required: true,
    },
    views:{
      type: Number,
      default: 0,
    },
    isPublished:{
      type: Boolean,
      default: true
    }
  },
  {
    timeseries: true,
  }
)

export const Video = mongoose.model('Video', videoSchema)