/**
 * AI Routes
 * POST /api/ai/enhance-bio      - Enhance user bio with AI
 * POST /api/ai/enhance-caption   - Improve post caption with AI
 * POST /api/ai/skill-match       - Find skill matches
 * GET  /api/notifications        - Get user notifications
 * PUT  /api/notifications/mark-read - Mark notifications as read
 */
const express = require("express");
const router = express.Router();
const {
  enhanceBio,
  enhanceCaption,
  skillMatch,
  getNotifications,
  markNotificationsRead,
} = require("../controllers/aiController");
const { verifyToken } = require("../middleware/auth");

// AI enhancement endpoints
router.post("/enhance-bio", verifyToken, enhanceBio);
router.post("/enhance-caption", verifyToken, enhanceCaption);
router.post("/skill-match", verifyToken, skillMatch);

// Notification endpoints (grouped here for convenience)
router.get("/notifications", verifyToken, getNotifications);
router.put("/notifications/mark-read", verifyToken, markNotificationsRead);

module.exports = router;
