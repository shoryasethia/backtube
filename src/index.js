import dotenv from 'dotenv'
dotenv.config()

import connectDB from './db/index.js'
import app from './app.js'

connectDB()
.then(() => {
  const PORT = process.env.PORT || 8000
  
  app.on("error", (error) => {
    console.log("Server NOT running: ", String(error))
    process.exit(1)
  })

  app.listen(PORT, () => {
    console.log(`Server is running at PORT=${PORT}`)
  })

})
.catch((error) => {
  console.log("MONGODB connection FAILED: ", String(error))
})