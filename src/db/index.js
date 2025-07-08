import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MONGODB connection SUCCESSFUL :: DB HOST: ${mongoose.connection.host}`)
  } 
  catch (error) {
    console.log("MONGODB connection FAILED: ", String(error))
    process.exit(1)
  }
}

export default connectDB

