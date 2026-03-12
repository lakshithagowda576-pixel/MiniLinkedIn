/**
 * Express Server Entry Point
 * Sets up MongoDB connection, middleware, routes, and static file serving
 */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import route modules
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const aiRoutes = require("./routes/aiRoutes");
const seedDatabase = require("./seedDatabase");

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// Middleware
// ========================

// 1. Security Headers (Helmet)
// Note: We adjust Content Security Policy to allow Tailwind CDN and Google Fonts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "www.gstatic.com"],
        "img-src": ["'self'", "data:", "https:", "http:"],
        "connect-src": ["'self'", "https://vitals.vercel-insights.com"],
      },
    },
  })
);

// 2. Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 3. Rate Limiting (Prevent Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/", limiter);

// 4. Compression (Faster transfers)
app.use(compression());

// 5. Global CORS
app.use(cors());

// 6. JSON & URL Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Health Check (For web server monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// 8. Static Frontend Files
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
