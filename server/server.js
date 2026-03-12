/**
 * Express Server Entry Point
 * Sets up MongoDB connection, middleware, routes, and static file serving
 */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import route modules
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// Middleware
// ========================

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[GLOBAL] ${req.method} ${req.url}`);
  next();
});

// Enable CORS for all origins (adjust in production)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the client directory
app.use(express.static(path.join(__dirname, "..", "client")));

// ========================
// API Routes
// ========================

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/ai", aiRoutes);

// ========================
// Health Check
// ========================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ========================
// Catch-All: Serve Frontend
// ========================

app.get("*", (req, res) => {
  // Only serve HTML for non-API routes
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "..", "client", "index.html"));
  } else {
    res.status(404).json({ success: false, message: "API endpoint not found" });
  }
});

// ========================
// Error Handling Middleware
// ========================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  // Handle multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ========================
// Database Connection & Server Start
// ========================

const seedDatabase = require("./seedDatabase");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/mini-ai-linkedin";

async function startServer() {
  try {
    console.log("Connecting to primary MongoDB URI...");
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ Connected to MongoDB successfully");
    await seedDatabase();
  } catch (err) {
    console.warn("⚠️  Primary MongoDB (Atlas) could not connect. This is usually due to an IP Whitelist issue.");
    console.log("Attempting to start in-memory MongoDB server as fallback for a seamless local experience...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log("✅ Connected to In-Memory MongoDB successfully. (Data will reset on server restart)");
      await seedDatabase();
    } catch (memErr) {
      console.error("❌ In-Memory MongoDB connection failed:", memErr.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API Base: http://localhost:${PORT}/api\n`);
  });
}

startServer();

module.exports = app;
