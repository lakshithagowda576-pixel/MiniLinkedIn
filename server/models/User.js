/**
 * User Model
 * Stores user profile information linked to Firebase UID
 */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Firebase UID - unique identifier from Firebase Authentication
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // User's display name
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // User's email address
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Profile picture URL (stored on Cloudinary)
    profilePicture: {
      type: String,
      default: "",
    },
    // User's professional bio
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    // Array of professional skills
    skills: {
      type: [String],
      default: [],
    },
    // Date when user joined the platform
    joinedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create text index on skills for efficient skill matching queries
userSchema.index({ skills: 1 });

module.exports = mongoose.model("User", userSchema);
