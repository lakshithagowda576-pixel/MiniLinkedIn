/**
 * Post Routes
 * POST /api/posts            - Create a new post
 * GET  /api/posts             - Get all posts (feed)
 * POST /api/posts/:id/like    - Toggle like on a post
 * POST /api/posts/:id/comment - Add comment to a post
 */
const express = require("express");
const router = express.Router();
const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
} = require("../controllers/postController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../../config/cloudinary");

// Create a post with optional image upload
router.post("/", verifyToken, upload.single("image"), createPost);

// Get all posts for the feed
router.get("/", verifyToken, getPosts);

// Toggle like on a post
router.post("/:id/like", verifyToken, toggleLike);

// Add a comment to a post
router.post("/:id/comment", verifyToken, addComment);

module.exports = router;
