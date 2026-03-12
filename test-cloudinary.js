const cloudinary = require('cloudinary').v2;
require('dotenv').config();

(async function() {
    // Configuration using your .env credentials
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    try {
        console.log("Uploading test image to Cloudinary...");
        // Upload an image
        const uploadResult = await cloudinary.uploader.upload(
            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
                public_id: 'shoes_test',
            }
        );
        
        console.log("✅ Upload Successful!");
        console.log("Image URL:", uploadResult.secure_url);
        
        // Optimize delivery by resizing and applying auto-format and auto-quality
        const optimizeUrl = cloudinary.url('shoes_test', {
            fetch_format: 'auto',
            quality: 'auto'
        });
        
        console.log("Optimized URL:", optimizeUrl);
        
        // Transform the image: auto-crop to square aspect_ratio
        const autoCropUrl = cloudinary.url('shoes_test', {
            crop: 'auto',
            gravity: 'auto',
            width: 500,
            height: 500,
        });
        
        console.log("Auto-cropped URL:", autoCropUrl);    
    } catch (error) {
        console.error("❌ Cloudinary Error:", error);
    }
})();
