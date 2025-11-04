const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// ✅ Function to connect to Cloudinary
exports.cloudinaryConnect = () => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.warn("⚠️ Cloudinary credentials missing in .env. Image upload will rely on local fallback.");
      return;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log('☁️ Cloudinary configured successfully.');
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error);
  }
};

// ✅ Function to upload an image to Cloudinary
exports.uploadImageToCloudinary = async (filePath, folder = 'uploads') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto', // handles images/videos
    });
    console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw error;
  }
};
