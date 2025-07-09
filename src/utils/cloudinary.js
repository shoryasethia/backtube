import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import ApiError from './ApiError.js';
import { ApiResponse } from './ApiResponse.js';

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
        // Clean up local file on error
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (unlinkError) {
            throw new ApiError(500, {} ,`Error removing local file: ${unlinkError.message}`);
        }
        
        throw new ApiError(500, {} ,`Error uploading file to cloudinary: ${error.message}`);
    }
};

const deleteFromCloudinary = async (cloudinaryUrl) => {
    try {
        if (!cloudinaryUrl) return null;
        
        // Extract public_id from the cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/{type}/{version}/{public_id}.{format}
        const urlParts = cloudinaryUrl.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const publicId = fileWithExtension.split('.')[0];
        
        if (!publicId) {
            throw new ApiError(400, {} ,`Could not extract public_id from URL: ${cloudinaryUrl}`);
        }
        
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image"
        });
        
        if (result.result === 'ok') {
            return new ApiResponse(200, result, "File deleted successfully from cloudinary");
        } else if (result.result === 'not found') {
            return new ApiResponse(404, result, "File not found in cloudinary");
        } else {
            throw new ApiError(500, {} ,`Failed to delete file from cloudinary: ${result.result}`);
        }
        
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, `Error deleting from cloudinary: ${error.message}`);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };