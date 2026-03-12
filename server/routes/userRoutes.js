/**
 * User Routes
 * POST /api/users/create  - Create a new user
 * GET  /api/users/:id     - Get user profile
 * PUT  /api/users/:id     - Update user profile
 */
const express = require("express");
const router = express.Router();
const { createUser, getUser, updateUser } = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../../config/cloudinary");

// Create user profile (requires authentication)
router.post("/create", verifyToken, createUser);

// Get user profile (requires authentication)
router.get("/:id", verifyToken, getUser);

// Update user profile with optional profile picture upload
router.put("/:id", verifyToken, upload.single("profilePicture"), updateUser);

module.exports = router;
