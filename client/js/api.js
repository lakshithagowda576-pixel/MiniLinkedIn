/**
 * API Helper Module
 * Centralized API communication layer with Firebase token management
 */

const API_BASE = "/api";

/**
 * Get the current Firebase auth token
 * @param {boolean} forceRefresh - If true, force Firebase to issue a fresh token
 * @returns {Promise<string|null>} The Firebase ID token
 */
async function getAuthToken(forceRefresh = false) {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., "/users/create")
 * @param {object} options - Fetch options
 * @param {boolean} isRetry - internal flag to prevent infinite loops on token refresh
 * @returns {Promise<object>} - Parsed JSON response
 */
async function apiRequest(endpoint, options = {}, isRetry = false) {
  const token = await getAuthToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // If token expired (401), try to refresh once
      if (response.status === 401 && !isRetry) {
        console.warn(`401 Unauthorized for ${endpoint}. Refreshing token...`);
        const newToken = await getAuthToken(true);
        if (newToken) {
          return apiRequest(endpoint, options, true);
        }
      }

      const error = new Error(data.message || "Request failed");
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status === 401) {
      console.error("Session expired or invalid. Redirecting to login.");
      firebase.auth().signOut().then(() => {
        window.location.href = "/index.html?error=auth_failed";
      });
    } else if (error.status !== 404) {
      console.error(`API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * GET request helper
 */
async function apiGet(endpoint) {
  return apiRequest(endpoint, { method: "GET" });
}

/**
 * POST request helper with JSON body
 */
async function apiPost(endpoint, body) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * POST request with FormData (for file uploads)
 */
async function apiPostForm(endpoint, formData) {
  return apiRequest(endpoint, {
    method: "POST",
    body: formData,
  });
}

/**
 * PUT request helper with JSON body
 */
async function apiPut(endpoint, body) {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request with FormData (for file uploads)
 */
async function apiPutForm(endpoint, formData) {
  return apiRequest(endpoint, {
    method: "PUT",
    body: formData,
  });
}

// ========================
// Toast Notification System
// ========================

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  toast.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========================
// Authentication State Helper
// ========================

/**
 * Check if user is authenticated. Redirect to login if not.
 * @param {function} callback - Function to call when user is authenticated
 */
function requireAuth(callback) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      callback(user);
    } else {
      window.location.href = "/index.html";
    }
  });
}

/**
 * Get current user's MongoDB profile data
 * @returns {Promise<object>} User profile from MongoDB
 */
async function getCurrentUserProfile() {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Not authenticated");
  try {
    const data = await apiGet(`/users/${user.uid}`);
    return data.user;
  } catch (error) {
    // If user not found (status 404), attempt to recreate the profile
    if (error.status === 404 || error.message.toLowerCase().includes("not found")) {
      console.log("Profile not found in MongoDB. Attempting to recreate...");
      try {
        const createData = await apiPost("/users/create", {
          name: user.displayName || user.email?.split("@")[0] || "Mini LinkedIn User",
          email: user.email || `${user.uid}@example.com`,
        });
        console.log("✅ Profile recreated successfully.");
        return createData.user;
      } catch (createError) {
        console.error("❌ Failed to recreate profile:", createError);
        throw createError;
      }
    }
    throw error;
  }
}

/**
 * Format a date string to a readable format
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Default avatar SVG data URL
 */
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232d333b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%238b949e'/%3E%3Cellipse cx='50' cy='75' rx='30' ry='22' fill='%238b949e'/%3E%3C/svg%3E";
