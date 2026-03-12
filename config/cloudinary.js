/**
 * Cloudinary Configuration
 * Handles image upload to Cloudinary cloud storage
 */
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration - store files in memory buffer for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image file types
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} folder - The Cloudinary folder to store in
 * @returns {Promise<object>} - Cloudinary upload result with secure_url
 */
const uploadToCloudinary = (fileBuffer, folder = "mini-linkedin") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
