// File: utils/imageUploader.js

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// --- 1. CLOUDINARY UPLOAD CORE ---
/**
 * Uploads a file buffer (from express-fileupload) to Cloudinary.
 * Returns a standardized object for consistency.
 */
const uploadFileToCloudinary = async (file, folder) => {
    try {
        // CRITICAL FIX: Convert file buffer to Base64 Data URI for reliable Cloudinary upload
        const base64Data = Buffer.from(file.data).toString('base64');
        const dataUri = `data:${file.mimetype};base64,${base64Data}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            resource_type: 'auto', // handles images/videos
        });

        return {
            location: 'cloudinary',
            url: result.secure_url, // Return the secure URL
            publicId: result.public_id || null,
        };
    } catch (error) {
        console.error('❌ Cloudinary upload failed in utility:', error);
        throw error;
    }
};


/**
 * Main handler to upload a file, attempting Cloudinary first.
 */
exports.uploadImageToCloudinary = async (file, folder = 'misc') => {
    // Check if Cloudinary is configured (api_key check is often sufficient)
    const isCloudinaryConfigured = !!cloudinary.config().api_key; 

    if (isCloudinaryConfigured) {
        console.log(`✅ Cloudinary configured. Attempting to upload ${file.name} to cloud.`);
        // Try Cloudinary upload. The controller handles the try-catch for the local fallback.
        return await uploadFileToCloudinary(file, folder); 
    } else {
        // If config is missing, force an error to trigger the local fallback logic in the controller.
        console.log(`⚠️ Cloudinary not configured. Skipping uploadFileToCloudinary attempt.`);
        throw new Error("Cloudinary not configured. Forced fallback.");
    }
};