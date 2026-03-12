/**
 * Post Controller
 * Handles CRUD operations for posts, likes, and comments
 */
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { uploadToCloudinary } = require("../../config/cloudinary");
const { getGroqResponse } = require("../../config/groq");

/**
 * POST /api/posts
 * Create a new post with optional image
 */
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!caption || !caption.trim()) {
      return res.status(400).json({
        success: false,
        message: "Caption is required.",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found. Please create your profile first.",
      });
    }

    let imageUrl = "";

    // Upload image to Cloudinary if provided
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "mini-linkedin/posts"
      );
      imageUrl = result.secure_url;
    }

    // Create the post document
    const post = new Post({
      author: req.user._id,
      caption: caption.trim(),
      imageUrl,
    });

    await post.save();

    // Run skill matching in the background (don't block the response)
    skillMatchInBackground(post, req.user).catch((err) =>
      console.error("Skill match error:", err)
    );

    // Populate author info before returning
    await post.populate("author", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post.",
      error: error.message,
    });
  }
};

/**
 * Background function to detect skills in a post and create match notifications
 */
async function skillMatchInBackground(post, postAuthor) {
  try {
    // Use Groq AI to extract skills from the caption
    const extractionPrompt = `Extract any professional/technical skills mentioned in the following text. 
Return ONLY a JSON array of skill names (lowercased). If no skills are found, return an empty array [].
Examples of skills: JavaScript, Python, React, Machine Learning, Data Analysis, etc.
Do not include any explanation, only the JSON array.`;

    const skillsResponse = await getGroqResponse(
      extractionPrompt,
      post.caption,
      200
    );

    // Parse the extracted skills
    let extractedSkills = [];
    try {
      // Find JSON array in the response
      const match = skillsResponse.match(/\[.*\]/s);
      if (match) {
        extractedSkills = JSON.parse(match[0]).map((s) =>
          s.toLowerCase().trim()
        );
      }
    } catch (parseError) {
      console.error("Failed to parse extracted skills:", parseError);
      return;
    }

    if (extractedSkills.length === 0) return;

    // Save mentioned skills to the post
    post.mentionedSkills = extractedSkills;
    await post.save();

    // Find users who have matching skills (exclude the post author)
    const matchingUsers = await User.find({
      _id: { $ne: postAuthor._id },
      skills: {
        $elemMatch: {
          $regex: new RegExp(extractedSkills.join("|"), "i"),
        },
      },
    });

    // Find other posts mentioning similar skills (exclude current post)
    const matchingPosts = await Post.find({
      _id: { $ne: post._id },
      author: { $ne: postAuthor._id },
      mentionedSkills: {
        $elemMatch: {
          $regex: new RegExp(extractedSkills.join("|"), "i"),
        },
      },
    }).populate("author", "name");

    // Collect unique users to notify (from both profile skills and post skills)
    const notifiedUserIds = new Set();

    // Create notifications for users with matching profile skills
    for (const matchedUser of matchingUsers) {
      if (notifiedUserIds.has(matchedUser._id.toString())) continue;
      notifiedUserIds.add(matchedUser._id.toString());

      const matchedSkill = extractedSkills.find((skill) =>
        matchedUser.skills.some(
          (userSkill) =>
            userSkill.toLowerCase().includes(skill) ||
            skill.includes(userSkill.toLowerCase())
        )
      );

      // Notify the post author about the match
      await Notification.create({
        recipient: postAuthor._id,
        type: "skill_match",
        message: `You and ${matchedUser.name} both mentioned ${matchedSkill || extractedSkills[0]}. Consider connecting since you share similar skills!`,
        matchedSkill: matchedSkill || extractedSkills[0],
        relatedUser: matchedUser._id,
        relatedPost: post._id,
      });

      // Also notify the matched user
      await Notification.create({
        recipient: matchedUser._id,
        type: "skill_match",
        message: `You and ${postAuthor.name} both share an interest in ${matchedSkill || extractedSkills[0]}. Consider connecting!`,
        matchedSkill: matchedSkill || extractedSkills[0],
        relatedUser: postAuthor._id,
        relatedPost: post._id,
      });
    }

    // Create notifications for users who mentioned similar skills in their posts
    for (const matchedPost of matchingPosts) {
      const matchedUserId = matchedPost.author._id.toString();
      if (notifiedUserIds.has(matchedUserId)) continue;
      notifiedUserIds.add(matchedUserId);

      const matchedSkill = extractedSkills.find((skill) =>
        matchedPost.mentionedSkills.some(
          (postSkill) =>
            postSkill.toLowerCase().includes(skill) ||
            skill.includes(postSkill.toLowerCase())
        )
      );

      await Notification.create({
        recipient: postAuthor._id,
        type: "skill_match",
        message: `You and ${matchedPost.author.name} both mentioned ${matchedSkill || extractedSkills[0]} in recent posts. Consider connecting!`,
        matchedSkill: matchedSkill || extractedSkills[0],
        relatedUser: matchedPost.author._id,
        relatedPost: post._id,
      });
    }

    console.log(
      `✅ Skill matching complete for post ${post._id}: ${extractedSkills.join(", ")}`
    );
  } catch (error) {
    console.error("Skill match background error:", error);
  }
}

/**
 * GET /api/posts
 * Get all posts for the feed (newest first)
 */
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name profilePicture")
      .populate("comments.author", "name profilePicture")
      .populate("likes", "name");

    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts.",
      error: error.message,
    });
  }
};

/**
 * POST /api/posts/:id/like
 * Toggle like on a post (like if not liked, unlike if already liked)
 */
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      // User hasn't liked - add like
      post.likes.push(userId);
    } else {
      // User already liked - remove like (toggle)
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked: likeIndex === -1,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like.",
      error: error.message,
    });
  }
};

/**
 * POST /api/posts/:id/comment
 * Add a comment to a post
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required.",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Add comment to the post
    post.comments.push({
      author: req.user._id,
      text: text.trim(),
    });

    await post.save();

    // Populate the last comment's author info
    await post.populate("comments.author", "name profilePicture");

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment.",
      error: error.message,
    });
  }
};

module.exports = { createPost, getPosts, toggleLike, addComment };
