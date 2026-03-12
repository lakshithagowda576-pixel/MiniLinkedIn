/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens sent in the Authorization header
 * Attaches the decoded user info to req.user
 */
const admin = require("../../config/firebase");
const User = require("../models/User");

/**
 * Middleware to verify Firebase JWT token
 * Expects: Authorization: Bearer <firebase-id-token>
 */
const verifyToken = async (req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // Verify the token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach Firebase user info to the request object
    req.firebaseUser = decodedToken;

    // Find the corresponding MongoDB user document
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    console.error("Full Error Object:", JSON.stringify(error));
    console.error("Stack Trace:", error.stack);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
        code: "TOKEN_EXPIRED"
      });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        success: false,
        message: "Malformed token. Please log in again.",
        code: "MALFORMED_TOKEN"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      code: "INVALID_TOKEN",
      error_detail: error.message
    });
  }
};

module.exports = { verifyToken };
