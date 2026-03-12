/**
 * Firebase Admin SDK Configuration
 * Used for verifying Firebase Authentication tokens on the server
 */
const admin = require("firebase-admin");
require("dotenv").config();
const path = require("path");

// Initialize Firebase Admin with service account credentials
// The service account key file should be placed at the path specified in .env
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "serviceAccountKey.json");

try {
  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.warn(
    "⚠️  Firebase Admin SDK not initialized - service account key not found."
  );
  console.warn(
    "   Place your serviceAccountKey.json in the config/ folder to enable authentication."
  );
  // Initialize without credentials for development
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

module.exports = admin;
