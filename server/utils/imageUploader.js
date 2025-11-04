const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { uploadImageToCloudinary: uploadToCloudinary } = require('../config/cloudinary'); // ✅ renamed to avoid conflict

// --- 1. LOCAL STORAGE FALLBACK FUNCTION ---
/**
 * Saves a file buffer to the local 'uploads' directory.
 * NOTE: Ensure the 'uploads' directory exists in your project root.
 */
const saveImageToLocalStorage = (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFile(filePath, file.data, (err) => {
      if (err) return reject(err);
      resolve({
        location: 'local',
        url: `/uploads/${folder}/${filename}`,
        publicId: null,
      });
    });
  });
};

// --- 2. CLOUDINARY UPLOAD WRAPPER ---
/**
 * Uploads a file buffer to Cloudinary.
 * Returns a standardized object for consistency.
 */
const uploadFileToCloudinary = async (file, folder) => {
  try {
    // Convert buffer to Base64 Data URI
    const base64Data = Buffer.from(file.data).toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64Data}`;

    const result = await uploadToCloudinary(dataUri, folder);

    return {
      location: 'cloudinary',
      url: result,
      publicId: result.public_id || null,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw error;
  }
};

// --- 3. UNIFIED ENTRY POINT ---
/**
 * Decides whether to upload to Cloudinary or local storage.
 */
exports.handleFileUpload = async (file, folder = 'misc') => {
  const isCloudinaryConfigured = !!cloudinary.config().cloud_name;

  if (isCloudinaryConfigured) {
    console.log(`✅ Cloudinary configured. Uploading ${file.name} to cloud.`);
    try {
      return await uploadFileToCloudinary(file, folder);
    } catch (error) {
      console.error(`⚠️ Cloudinary failed (${error.message}). Using local fallback.`);
      return await saveImageToLocalStorage(file, folder);
    }
  } else {
    console.log(`⚠️ Cloudinary not configured. Saving ${file.name} locally.`);
    return await saveImageToLocalStorage(file, folder);
  }
};
