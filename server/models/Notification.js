/**
 * Notification Model
 * Stores skill-match notifications and connection suggestions
 */
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // User who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Type of notification (skill_match, connection_suggestion, etc.)
    type: {
      type: String,
      enum: ["skill_match", "connection_suggestion", "general"],
      default: "general",
    },
    // Notification message text
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    // The matched skill that triggered this notification
    matchedSkill: {
      type: String,
      default: "",
    },
    // Reference to the other user involved (e.g., matched user)
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Reference to the post that triggered this notification
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    // Whether the user has read this notification
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching user notifications efficiently
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
