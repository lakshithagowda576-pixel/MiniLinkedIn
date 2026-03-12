/**
 * User Controller
 * Handles user creation, retrieval, and profile updates
 */
const User = require("../models/User");
const { uploadToCloudinary } = require("../../config/cloudinary");

/**
 * POST /api/users/create
 * Create a new user profile after Firebase signup
 */
const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const firebaseUid = req.firebaseUser.uid;

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        user: existingUser,
      });
    }

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    // Create new user document in MongoDB
    const newUser = new User({
      firebaseUid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      joinedDate: new Date(),
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user.",
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 * Get a user profile by MongoDB ObjectId or Firebase UID
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB ObjectId first, then by Firebase UID
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ firebaseUid: id });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
      error: error.message,
    });
  }
};

/**
 * PUT /api/users/:id
 * Update user profile (only the profile owner can update)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, skills } = req.body;

    // Find the user
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ firebaseUid: id });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify that the requesting user owns this profile
    if (user.firebaseUid !== req.firebaseUser.uid) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own profile.",
      });
    }

    // Update fields if provided
    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (skills !== undefined) {
      // Parse skills: accept comma-separated string or array
      user.skills = Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }

    // Handle profile picture upload if a file is attached
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "mini-linkedin/profiles"
      );
      user.profilePicture = result.secure_url;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

module.exports = { createUser, getUser, updateUser };
