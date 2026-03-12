/**
 * Create Post Page Logic
 * Handles post creation with image upload and AI caption enhancement
 */

let selectedImageFile = null;

requireAuth(async (user) => {
  // User authenticated, page ready
});

// Logout handler
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await firebase.auth().signOut();
  window.location.href = "/index.html";
});

// ========================
// Character Counter
// ========================
const captionInput = document.getElementById("post-caption");
const charCount = document.getElementById("char-count");

captionInput?.addEventListener("input", () => {
  const len = captionInput.value.length;
  charCount.textContent = `${len} / 3000`;
  if (len > 2800) {
    charCount.style.color = "var(--danger)";
  } else {
    charCount.style.color = "var(--text-muted)";
  }
});

// ========================
// Image Upload Handling
// ========================
const imageInput = document.getElementById("post-image");
const uploadArea = document.getElementById("image-upload-area");

imageInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    selectedImageFile = file;
    previewImage(file);
  }
});

// Drag and drop support
uploadArea?.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "var(--primary)";
  uploadArea.style.background = "rgba(10, 102, 194, 0.05)";
});

uploadArea?.addEventListener("dragleave", () => {
  uploadArea.style.borderColor = "var(--border-color)";
  uploadArea.style.background = "transparent";
});

uploadArea?.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "var(--border-color)";
  uploadArea.style.background = "transparent";

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    selectedImageFile = file;
    previewImage(file);
  } else {
    showToast("Please drop an image file", "error");
  }
});

function previewImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("image-preview").src = e.target.result;
    document.getElementById("upload-placeholder").classList.add("hidden");
    document.getElementById("image-preview-container").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  selectedImageFile = null;
  imageInput.value = "";
  document.getElementById("upload-placeholder").classList.remove("hidden");
  document.getElementById("image-preview-container").classList.add("hidden");
}

// Make removeImage accessible globally for the onclick handler
window.removeImage = removeImage;

// ========================
// AI Caption Enhancement
// ========================
document.getElementById("enhance-caption-btn")?.addEventListener("click", async () => {
  const caption = captionInput.value.trim();
  if (!caption) {
    showToast("Write a caption first before enhancing", "error");
    return;
  }

  const btn = document.getElementById("enhance-caption-btn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Enhancing...";

  try {
    const data = await apiPost("/ai/enhance-caption", { caption });
    
    // Show AI preview
    document.getElementById("ai-caption-text").textContent = data.enhanced;
    document.getElementById("ai-caption-preview").classList.remove("hidden");
    document.getElementById("ai-caption-preview").classList.add("animate-slide-down");
  } catch (error) {
    showToast("AI enhancement failed. Please try again.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// Use AI-enhanced caption
document.getElementById("use-ai-caption")?.addEventListener("click", () => {
  const aiText = document.getElementById("ai-caption-text").textContent;
  captionInput.value = aiText;
  captionInput.dispatchEvent(new Event("input")); // Update char count
  document.getElementById("ai-caption-preview").classList.add("hidden");
  showToast("AI caption applied!", "success");
});

// Discard AI caption
document.getElementById("discard-ai-caption")?.addEventListener("click", () => {
  document.getElementById("ai-caption-preview").classList.add("hidden");
});

// ========================
// Form Submission
// ========================
document.getElementById("create-post-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const caption = captionInput.value.trim();
  if (!caption) {
    showToast("Please write a caption", "error");
    return;
  }

  const submitBtn = document.getElementById("submit-post-btn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;margin:0 auto;border-width:2px;"></div>';

  try {
    const formData = new FormData();
    formData.append("caption", caption);

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    }

    await apiPostForm("/posts", formData);

    showToast("Post published! 🚀", "success");

    setTimeout(() => {
      window.location.href = "/feed.html";
    }, 1000);
  } catch (error) {
    showToast("Failed to publish post. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Publish Post";
  }
});
