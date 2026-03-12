/**
 * AI Controller
 * Handles AI-powered features using Groq API:
 * - Bio enhancement
 * - Caption improvement
 * - Skill matching
 */
const { getGroqResponse } = require("../../config/groq");
const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * POST /api/ai/enhance-bio
 * Enhance a user's professional bio using AI
 */
const enhanceBio = async (req, res) => {
  try {
    const { bio } = req.body;

    if (!bio || !bio.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bio text is required.",
      });
    }

    const systemPrompt = `You are a professional LinkedIn profile writer. 
Your task is to enhance the given bio to make it more professional, engaging, and polished.
Keep it concise (2-4 sentences max). Do not add fictional details.
Return ONLY the enhanced bio text, nothing else. No quotes, no explanations.`;

    const enhancedBio = await getGroqResponse(systemPrompt, bio, 300);

    res.status(200).json({
      success: true,
      original: bio,
      enhanced: enhancedBio.trim(),
    });
  } catch (error) {
    console.error("Enhance bio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enhance bio.",
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/enhance-caption
 * Improve a post caption using AI
 */
const enhanceCaption = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!caption || !caption.trim()) {
      return res.status(400).json({
        success: false,
        message: "Caption text is required.",
      });
    }

    const systemPrompt = `You are a social media content expert specializing in professional LinkedIn posts.
Your task is to improve the given post caption to make it more engaging, clear, and professional.
Keep the same core message but enhance the language, add relevant emojis sparingly, and make it more impactful.
Keep it concise and professional. Return ONLY the improved caption, nothing else.`;

    const enhancedCaption = await getGroqResponse(systemPrompt, caption, 500);

    res.status(200).json({
      success: true,
      original: caption,
      enhanced: enhancedCaption.trim(),
    });
  } catch (error) {
    console.error("Enhance caption error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enhance caption.",
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/skill-match
 * Manually trigger skill matching for a user
 */
const skillMatch = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const userSkills = req.user.skills;

    if (!userSkills || userSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "You have no skills in your profile. Add skills to find matches.",
      });
    }

    // Find other users with overlapping skills
    const matchingUsers = await User.find({
      _id: { $ne: req.user._id },
      skills: {
        $elemMatch: {
          $regex: new RegExp(userSkills.join("|"), "i"),
        },
      },
    }).select("name profilePicture skills");

    // Create notifications for new matches
    for (const matchedUser of matchingUsers) {
      const sharedSkills = matchedUser.skills.filter((skill) =>
        userSkills.some(
          (userSkill) =>
            userSkill.toLowerCase() === skill.toLowerCase() ||
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      // Check if notification already exists to avoid duplicates
      const existingNotification = await Notification.findOne({
        recipient: req.user._id,
        relatedUser: matchedUser._id,
        type: "skill_match",
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
      });

      if (!existingNotification && sharedSkills.length > 0) {
        await Notification.create({
          recipient: req.user._id,
          type: "skill_match",
          message: `You and ${matchedUser.name} both have skills in ${sharedSkills.join(", ")}. Consider connecting!`,
          matchedSkill: sharedSkills[0],
          relatedUser: matchedUser._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      matchCount: matchingUsers.length,
      matches: matchingUsers,
    });
  } catch (error) {
    console.error("Skill match error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to find skill matches.",
      error: error.message,
    });
  }
};

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
const getNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("relatedUser", "name profilePicture")
      .populate("relatedPost", "caption");

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

/**
 * PUT /api/notifications/mark-read
 * Mark all notifications as read for the current user
 */
const markNotificationsRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found.",
      });
    }

    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
      error: error.message,
    });
  }
};

module.exports = {
  enhanceBio,
  enhanceCaption,
  skillMatch,
  getNotifications,
  markNotificationsRead,
};
