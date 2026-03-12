/**
 * Profile Page Logic
 * Loads and displays user profile with their posts
 * Supports viewing own profile or another user's profile via ?id= query param
 */

let viewedUser = null;
let isOwnProfile = false;

requireAuth(async (firebaseUser) => {
  try {
    // Get profile ID from URL query parameter, or show own profile
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get("id");

    let profileData;

    if (profileId) {
      // Viewing someone else's (or own) profile by ID
      profileData = await apiGet(`/users/${profileId}`);
      viewedUser = profileData.user;
    } else {
      // Viewing own profile (no ID in URL)
      viewedUser = await getCurrentUserProfile();
    }

    // Check if this is the current user's own profile
    isOwnProfile = viewedUser.firebaseUid === firebaseUser.uid;

    renderProfile(viewedUser);
    loadUserPosts(viewedUser._id);
  } catch (error) {
    console.error("Profile load error:", error);
    showToast("Failed to load profile", "error");
  }
});

// Logout handler
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await firebase.auth().signOut();
  window.location.href = "/index.html";
});

/**
 * Render the profile information
 */
function renderProfile(user) {
  // Avatar
  const avatarEl = document.getElementById("profile-avatar");
  avatarEl.src = user.profilePicture || DEFAULT_AVATAR;
  avatarEl.onerror = () => (avatarEl.src = DEFAULT_AVATAR);

  // Name
  document.getElementById("profile-name").textContent = user.name;
  document.title = `${user.name} - Mini AI LinkedIn`;

  // Email
  document.getElementById("profile-email").textContent = user.email;

  // Joined date
  const joinedDate = new Date(user.joinedDate || user.createdAt);
  document.getElementById("profile-joined").textContent = `Joined ${joinedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;

  // Bio
  const bioEl = document.getElementById("profile-bio");
  const noBioEl = document.getElementById("no-bio");
  if (user.bio && user.bio.trim()) {
    bioEl.textContent = user.bio;
    noBioEl.classList.add("hidden");
  } else {
    bioEl.classList.add("hidden");
    noBioEl.classList.remove("hidden");
  }

  // Skills
  const skillsEl = document.getElementById("profile-skills");
  const noSkillsEl = document.getElementById("no-skills");
  if (user.skills && user.skills.length > 0) {
    skillsEl.innerHTML = user.skills
      .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
      .join("");
    noSkillsEl.classList.add("hidden");
  } else {
    skillsEl.innerHTML = "";
    noSkillsEl.classList.remove("hidden");
  }

  // Show edit button only for own profile
  if (isOwnProfile) {
    const editContainer = document.getElementById("edit-btn-container");
    editContainer.classList.remove("hidden");
    document.getElementById("edit-profile-link").href = `/edit-profile.html?id=${user._id}`;
  }
}

/**
 * Load posts by this user
 */
async function loadUserPosts(userId) {
  try {
    // Fetch all posts and filter by user
    const data = await apiGet("/posts?limit=100");
    const userPosts = data.posts.filter(
      (post) => post.author?._id === userId
    );

    const postsContainer = document.getElementById("user-posts");
    const noPostsEl = document.getElementById("no-posts");

    if (userPosts.length === 0) {
      postsContainer.innerHTML = "";
      noPostsEl.classList.remove("hidden");
      return;
    }

    postsContainer.innerHTML = userPosts
      .map(
        (post) => `
      <div class="mb-4 pb-4" style="border-bottom: 1px solid var(--border-color);">
        <p class="text-sm leading-relaxed" style="color: var(--text-primary); white-space: pre-wrap;">${escapeHtml(post.caption)}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image mt-3" style="max-height: 300px;" loading="lazy" />` : ""}
        <div class="flex items-center gap-4 mt-3">
          <span class="text-xs" style="color: var(--text-muted);">
            ❤️ ${post.likes?.length || 0} likes
          </span>
          <span class="text-xs" style="color: var(--text-muted);">
            💬 ${post.comments?.length || 0} comments
          </span>
          <span class="text-xs" style="color: var(--text-muted);">
            ${formatDate(post.createdAt)}
          </span>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Load user posts error:", error);
    document.getElementById("user-posts").innerHTML =
      '<p class="text-sm text-center" style="color: var(--text-muted);">Failed to load posts.</p>';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
