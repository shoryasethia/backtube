import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto"
        });

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return uploadResult;

    } catch (error) {
        console.error(`Error uploading ${localFilePath}: `, error);
        
        // Clean up local file on error
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (unlinkError) {
            console.error(`Error removing local file: `, unlinkError);
        }
        
        return null;
    }
};

export { uploadOnCloudinary };