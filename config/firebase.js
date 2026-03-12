/**
 * Firebase Admin SDK Configuration
 * Used for verifying Firebase Authentication tokens on the server
 */
const admin = require("firebase-admin");
require("dotenv").config();
const path = require("path");

// Initialize Firebase Admin with service account credentials
// The service account key file should be placed at the path specified in .env
// Initialize Firebase Admin with service account credentials
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "serviceAccountKey.json");

const absoluteServiceAccountPath = path.isAbsolute(serviceAccountPath) 
  ? serviceAccountPath 
  : path.resolve(process.cwd(), serviceAccountPath);

console.log(`Attempting to load Firebase service account from: ${absoluteServiceAccountPath}`);

try {
  const serviceAccount = require(absoluteServiceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.warn("⚠️  Firebase Admin SDK initialization failed.");
  console.error("Error Detail:", error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error(`ERROR: Service account file NOT found at: ${absoluteServiceAccountPath}`);
  }

  // Initialize without credentials ONLY if absolutely necessary for restricted local dev
  if (!admin.apps.length) {
    console.log("Initializing Admin SDK without credentials (limited functionality)...");
    admin.initializeApp();
  }
}

module.exports = admin;
