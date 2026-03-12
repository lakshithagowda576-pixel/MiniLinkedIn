/**
 * Post Model
 * Stores LinkedIn-style posts with likes and comments
 */
const mongoose = require("mongoose");

// Sub-schema for comments on a post
const commentSchema = new mongoose.Schema({
  // Reference to the user who made the comment
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Comment text content
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  // When the comment was posted
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema(
  {
    // Reference to the post author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Post text caption
    caption: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    // Optional image URL (stored on Cloudinary)
    imageUrl: {
      type: String,
      default: "",
    },
    // Array of user IDs who liked this post
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Array of comments on this post
    comments: [commentSchema],
    // Skills mentioned or detected in this post
    mentionedSkills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for fetching posts in reverse chronological order
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
