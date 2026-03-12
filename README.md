# 🚀 Mini AI LinkedIn

A professional networking web application with AI-powered features, built with Node.js, Express, MongoDB, Firebase Auth, Cloudinary, and Groq AI.

![Mini AI LinkedIn](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

---

## ✨ Features

### Core Features
- 🔐 **User Authentication** — Firebase Email/Password signup & login
- 👤 **User Profiles** — Name, avatar, bio, skills, joined date
- 📝 **Post System** — LinkedIn-style posts with images
- ❤️ **Post Interactions** — Like/unlike and comment on posts
- 🔔 **Notifications** — Skill match alerts and connection suggestions

### AI-Powered Features (Groq API)
- 🤖 **AI Bio Enhancer** — Transform casual bios into professional ones
- ✍️ **AI Caption Enhancer** — Improve post captions for engagement
- 🎯 **Skill Match Detection** — Auto-detect skills in posts and match users with similar interests

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, Tailwind CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | Firebase Authentication |
| Image Storage | Cloudinary |
| AI | Groq API (LLaMA 3.3 70B) |

---

## 📂 Project Structure

```
mini-ai-linkedin/
├── client/                    # Frontend
│   ├── index.html             # Login / Signup page
│   ├── feed.html              # Home feed
│   ├── create-post.html       # Create new post
│   ├── profile.html           # User profile view
│   ├── edit-profile.html      # Edit own profile
│   ├── notifications.html     # Notifications page
│   ├── css/
│   │   └── styles.css         # Custom CSS (glassmorphism, animations)
│   └── js/
│       ├── api.js             # API helper & utilities
│       ├── auth.js            # Firebase auth logic
│       ├── feed.js            # Feed page logic
│       ├── createPost.js      # Create post logic
│       ├── profile.js         # Profile page logic
│       ├── editProfile.js     # Edit profile logic
│       └── notifications.js   # Notifications logic
│
├── server/                    # Backend
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   ├── userRoutes.js      # User API routes
│   │   ├── postRoutes.js      # Post API routes
│   │   └── aiRoutes.js        # AI & notification routes
│   ├── controllers/
│   │   ├── userController.js  # User CRUD logic
│   │   ├── postController.js  # Post CRUD + skill matching
│   │   └── aiController.js    # AI features + notifications
│   ├── models/
│   │   ├── User.js            # User Mongoose schema
│   │   ├── Post.js            # Post schema with comments
│   │   └── Notification.js    # Notification schema
│   └── middleware/
│       └── auth.js            # Firebase token verification
│
├── config/
│   ├── cloudinary.js          # Cloudinary + Multer setup
│   ├── firebase.js            # Firebase Admin SDK init
│   └── groq.js                # Groq API client
│
├── .env                       # Environment variables
├── .env.example               # Template for env vars
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

1. **Node.js** (v18+) — [Download](https://nodejs.org/)
2. **MongoDB** — [Install](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
3. **Firebase Project** — [Create one](https://console.firebase.google.com/)
4. **Cloudinary Account** — [Sign up free](https://cloudinary.com/)
5. **Groq API Key** — [Get one](https://console.groq.com/)

---

### Step 1: Clone & Install Dependencies

```bash
cd "d:\Mini LinkedIn"
npm install
```

---

### Step 2: Firebase Setup

#### A. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** and follow the steps
3. Go to **Authentication** → **Sign-in method** → Enable **Email/Password**

#### B. Get Firebase Web Config (for Frontend)
1. Go to **Project Settings** → **General** → **Your Apps**
2. Click **Add App** → Select **Web** (</>) icon
3. Copy the `firebaseConfig` object
4. Paste it into `client/js/auth.js` replacing the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

#### C. Generate Service Account Key (for Backend)
1. Go to **Project Settings** → **Service Accounts**
2. Click **"Generate New Private Key"**
3. Save the downloaded JSON file as `config/serviceAccountKey.json`

---

### Step 3: Cloudinary Setup

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy your **Cloud Name**, **API Key**, and **API Secret**
3. Update `.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### Step 4: Groq API Setup

1. Go to [Groq Console](https://console.groq.com/keys)
2. Create a new API key
3. Update `.env`:

```
GROQ_API_KEY=gsk_your_api_key_here
```

---

### Step 5: MongoDB Setup

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running locally
# Default connection: mongodb://localhost:27017/mini-ai-linkedin
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Update `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mini-ai-linkedin
```

---

### Step 6: Start the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The app will be available at: **http://localhost:5000**

---

## 🔌 API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/create` | Create user profile |
| GET | `/api/users/:id` | Get user by ID or Firebase UID |
| PUT | `/api/users/:id` | Update user profile |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a post (with optional image) |
| GET | `/api/posts` | Get all posts (paginated) |
| POST | `/api/posts/:id/like` | Toggle like on a post |
| POST | `/api/posts/:id/comment` | Add comment to a post |

### AI & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/enhance-bio` | AI-enhance a profile bio |
| POST | `/api/ai/enhance-caption` | AI-improve a post caption |
| POST | `/api/ai/skill-match` | Find users with matching skills |
| GET | `/api/ai/notifications` | Get user notifications |
| PUT | `/api/ai/notifications/mark-read` | Mark all as read |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## 🎨 UI Pages

| Page | URL | Description |
|------|-----|-------------|
| Login/Signup | `/` or `/index.html` | Authentication page |
| Home Feed | `/feed.html` | Public post feed |
| Create Post | `/create-post.html` | New post with AI caption |
| Profile | `/profile.html` | View own profile |
| View Profile | `/profile.html?id=<userId>` | View other user's profile |
| Edit Profile | `/edit-profile.html` | Edit own profile with AI bio |
| Notifications | `/notifications.html` | Skill match alerts |

---

## 🛡️ Security

- All API routes are protected with Firebase token verification
- Profile edits restricted to profile owner only
- HTML output is escaped to prevent XSS attacks
- File uploads are limited to images under 5MB
- Input validation on all forms

---

## 📄 License

MIT License — feel free to use and modify for your projects.
