/**
 * Edit Profile Page Logic
 * Pre-fills form with current user data, handles updates with Cloudinary upload
 * and AI bio enhancement
 */

let currentUser = null;
let selectedAvatarFile = null;

requireAuth(async (firebaseUser) => {
  try {
    // Load current user profile
    currentUser = await getCurrentUserProfile();

    // Pre-fill form fields
    document.getElementById("edit-name").value = currentUser.name || "";
    document.getElementById("edit-bio").value = currentUser.bio || "";
    document.getElementById("edit-skills").value =
      currentUser.skills?.join(", ") || "";

    // Set avatar preview
    const avatarEl = document.getElementById("edit-avatar-preview");
    avatarEl.src = currentUser.profilePicture || DEFAULT_AVATAR;
    avatarEl.onerror = () => (avatarEl.src = DEFAULT_AVATAR);

    // Update char count
    updateBioCharCount();
    // Update skills preview
    updateSkillsPreview();
  } catch (error) {
    console.error("Load profile error:", error);
    showToast("Failed to load profile data", "error");
  }
});

// Logout handler
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await firebase.auth().signOut();
  window.location.href = "/index.html";
});

// ========================
// Avatar Upload
// ========================
document.getElementById("edit-avatar-input")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("edit-avatar-preview").src = ev.target.result;
    };
    reader.readAsDataURL(file);
    showToast("New photo selected. Save to apply.", "info");
  }
});

// ========================
// Bio Character Counter
// ========================
const bioInput = document.getElementById("edit-bio");
const bioCharEl = document.getElementById("bio-char-count");

bioInput?.addEventListener("input", updateBioCharCount);

function updateBioCharCount() {
  const len = bioInput.value.length;
  bioCharEl.textContent = `${len} / 500`;
  bioCharEl.style.color = len > 450 ? "var(--danger)" : "var(--text-muted)";
}

// ========================
// Skills Preview
// ========================
const skillsInput = document.getElementById("edit-skills");
const skillsPreview = document.getElementById("skills-preview");

skillsInput?.addEventListener("input", updateSkillsPreview);

function updateSkillsPreview() {
  const skills = skillsInput.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (skills.length > 0) {
    skillsPreview.innerHTML = skills
      .map((skill) => `<span class="skill-tag text-xs">${escapeHtml(skill)}</span>`)
      .join("");
  } else {
    skillsPreview.innerHTML = "";
  }
}

// ========================
// AI Bio Enhancement
// ========================
document.getElementById("enhance-bio-btn")?.addEventListener("click", async () => {
  const bio = bioInput.value.trim();
  if (!bio) {
    showToast("Write a bio first before enhancing", "error");
    return;
  }

  const btn = document.getElementById("enhance-bio-btn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Enhancing...";

  try {
    const data = await apiPost("/ai/enhance-bio", { bio });

    document.getElementById("ai-bio-text").textContent = data.enhanced;
    document.getElementById("ai-bio-preview").classList.remove("hidden");
    document.getElementById("ai-bio-preview").classList.add("animate-slide-down");
  } catch (error) {
    showToast("AI enhancement failed. Please try again.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// Use AI bio
document.getElementById("use-ai-bio")?.addEventListener("click", () => {
  const aiText = document.getElementById("ai-bio-text").textContent;
  bioInput.value = aiText;
  updateBioCharCount();
  document.getElementById("ai-bio-preview").classList.add("hidden");
  showToast("AI bio applied!", "success");
});

// Discard AI bio
document.getElementById("discard-ai-bio")?.addEventListener("click", () => {
  document.getElementById("ai-bio-preview").classList.add("hidden");
});

// ========================
// Form Submission
// ========================
document.getElementById("edit-profile-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("edit-name").value.trim();
  const bio = bioInput.value.trim();
  const skills = skillsInput.value.trim();

  if (!name) {
    showToast("Name is required", "error");
    return;
  }

  const submitBtn = document.getElementById("save-profile-btn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;margin:0 auto;border-width:2px;"></div>';

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("skills", skills);

    if (selectedAvatarFile) {
      formData.append("profilePicture", selectedAvatarFile);
    }

    // Use the Firebase UID for the update endpoint
    await apiPutForm(`/users/${currentUser.firebaseUid}`, formData);

    showToast("Profile updated successfully! ✨", "success");

    setTimeout(() => {
      window.location.href = "/profile.html";
    }, 1200);
  } catch (error) {
    showToast("Failed to update profile. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Changes";
  }
});

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
