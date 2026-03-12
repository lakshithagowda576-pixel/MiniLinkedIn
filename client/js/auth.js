/**
 * Authentication Page Logic
 * Handles Firebase Email/Password signup and login
 */

if (window.location.protocol === "file:") {
  alert("⚠️ CRITICAL: You are opening this file directly from your computer. Please use http://localhost:5000 to run the project correctly.");
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCZD88agqWk94hhUOgP29SGkx5mgrurAM",
  authDomain: "minilinkedin-22fce.firebaseapp.com",
  projectId: "minilinkedin-22fce",
  storageBucket: "minilinkedin-22fce.firebasestorage.app",
  messagingSenderId: "734421395930",
  appId: "1:734421395930:web:b335a44813a97790cbf8e3",
  measurementId: "G-KWNCGXNLNV",
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// DOM Elements
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignupLink = document.getElementById("show-signup");
const showLoginLink = document.getElementById("show-login");
const loginSection = document.getElementById("login-section");
const signupSection = document.getElementById("signup-section");

// Toggle between Login and Signup forms
showSignupLink?.addEventListener("click", (e) => {
  e.preventDefault();
  loginSection.classList.add("hidden");
  signupSection.classList.remove("hidden");
  signupSection.classList.add("animate-fade-in-up");
});

showLoginLink?.addEventListener("click", (e) => {
  e.preventDefault();
  signupSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  loginSection.classList.add("animate-fade-in-up");
});

/**
 * Handle Signup Form Submission
 */
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const submitBtn = signupForm.querySelector('button[type="submit"]');

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;margin:0 auto;border-width:2px;"></div>';

    // Create user with Firebase Authentication
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);

    // Update Firebase profile display name
    await userCredential.user.updateProfile({ displayName: name });

    // Create user profile in MongoDB via our API
    await apiPost("/users/create", { name, email });

    showToast("Account created successfully! 🎉", "success");

    setTimeout(() => {
      window.location.href = "/feed.html";
    }, 1000);
  } catch (error) {
    console.error("Signup error:", error);
    let message = "Signup failed. Please try again.";
    if (error.code === "auth/email-already-in-use") message = "This email is already registered.";
    showToast(message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});

/**
 * Handle Login Form Submission
 */
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  if (!email || !password) {
    showToast("Please enter your email and password", "error");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;margin:0 auto;border-width:2px;"></div>';

    // Sign in with Firebase
    await firebase.auth().signInWithEmailAndPassword(email, password);

    showToast("Welcome back! 👋", "success");

    setTimeout(() => {
      window.location.href = "/feed.html";
    }, 800);
  } catch (error) {
    console.error("Login error:", error);
    let message = "Login failed. Please check your credentials.";
    if (error.code === "auth/user-not-found") message = "No account found with this email.";
    if (error.code === "auth/wrong-password") message = "Incorrect password.";
    
    showToast(message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In";
  }
});

// If user is already logged in, redirect to feed
firebase.auth().onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "/feed.html";
  }
});
