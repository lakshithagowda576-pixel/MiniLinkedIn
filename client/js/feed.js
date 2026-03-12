/**
 * Feed Page Logic
 * Loads and renders posts, handles likes, comments, and pagination
 */

let currentPage = 1;
let totalPages = 1;
let currentUserProfile = null;

// Initialize feed when user is authenticated
requireAuth(async (firebaseUser) => {
  try {
    // Load current user profile for avatar and like checks
    currentUserProfile = await getCurrentUserProfile();
    
    // Set user avatar in the create-post CTA
    const avatarEl = document.getElementById("feed-user-avatar");
    if (avatarEl) {
      avatarEl.src = currentUserProfile.profilePicture || DEFAULT_AVATAR;
      avatarEl.onerror = () => (avatarEl.src = DEFAULT_AVATAR);
    }

    // Load notification count for badge
    loadNotificationBadge();

    // Load the feed
    await loadFeed();
  } catch (error) {
    console.error("Feed init error:", error);
    showToast("Failed to load feed", "error");
  }
});

// Logout handler
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await firebase.auth().signOut();
  window.location.href = "/index.html";
});

/**
 * Load notification count for the navbar badge
 */
async function loadNotificationBadge() {
  try {
    const data = await apiGet("/ai/notifications");
    const badge = document.getElementById("nav-notif-badge");
    if (data.unreadCount > 0) {
      badge.textContent = data.unreadCount > 9 ? "9+" : data.unreadCount;
      badge.classList.remove("hidden");
    }
  } catch (err) {
    // Silently fail - badge is optional
  }
}

/**
 * Load posts from the API and render them
 */
async function loadFeed(page = 1) {
  try {
    const data = await apiGet(`/posts?page=${page}&limit=20`);
    const loadingEl = document.getElementById("feed-loading");
    const postsListEl = document.getElementById("posts-list");
    const emptyStateEl = document.getElementById("empty-state");
    const loadMoreContainer = document.getElementById("load-more-container");

    // Hide loading skeleton
    loadingEl.classList.add("hidden");

    if (data.posts.length === 0 && page === 1) {
      emptyStateEl.classList.remove("hidden");
      return;
    }

    // Render posts
    postsListEl.classList.remove("hidden");
    
    if (page === 1) {
      postsListEl.innerHTML = "";
    }

    data.posts.forEach((post, index) => {
      const postEl = createPostElement(post, index);
      postsListEl.appendChild(postEl);
    });

    // Update pagination
    totalPages = data.pagination.pages;
    currentPage = page;

    if (currentPage < totalPages) {
      loadMoreContainer.classList.remove("hidden");
    } else {
      loadMoreContainer.classList.add("hidden");
    }
  } catch (error) {
    console.error("Load feed error:", error);
    document.getElementById("feed-loading").classList.add("hidden");
    showToast("Failed to load posts", "error");
  }
}

/**
 * Create a post card DOM element
 */
function createPostElement(post, index) {
  const div = document.createElement("div");
  div.className = "post-card animate-fade-in-up";
  div.style.animationDelay = `${index * 0.05}s`;
  div.style.opacity = "0";

  const authorName = post.author?.name || "Unknown User";
  const authorAvatar = post.author?.profilePicture || DEFAULT_AVATAR;
  const authorId = post.author?._id || "";
  const isLiked = currentUserProfile && post.likes?.some(
    (like) => (like._id || like) === currentUserProfile._id
  );
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const timeAgo = formatDate(post.createdAt);

  div.innerHTML = `
    <!-- Post Header -->
    <div class="post-author">
      <a href="/profile.html?id=${authorId}">
        <img src="${authorAvatar}" alt="${authorName}" class="post-avatar" onerror="this.src='${DEFAULT_AVATAR}'" />
      </a>
      <div>
        <a href="/profile.html?id=${authorId}" class="font-semibold text-sm hover:underline" style="color: var(--text-primary); text-decoration: none;">
          ${escapeHtml(authorName)}
        </a>
        <p class="text-xs" style="color: var(--text-muted);">${timeAgo}</p>
      </div>
    </div>

    <!-- Post Caption -->
    <p class="text-sm leading-relaxed mb-2" style="color: var(--text-primary); white-space: pre-wrap;">${escapeHtml(post.caption)}</p>

    ${post.mentionedSkills?.length > 0 ? `
      <div class="flex flex-wrap gap-2 mb-3">
        ${post.mentionedSkills.map(skill => `<span class="skill-tag text-xs">${escapeHtml(skill)}</span>`).join("")}
      </div>
    ` : ""}

    <!-- Post Image -->
    ${post.imageUrl ? `
      <img src="${post.imageUrl}" alt="Post image" class="post-image" loading="lazy" />
    ` : ""}

    <!-- Post Actions -->
    <div class="post-actions">
      <button class="post-action-btn ${isLiked ? "liked" : ""}" onclick="toggleLike('${post._id}', this)" id="like-btn-${post._id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/>
        </svg>
        <span id="likes-count-${post._id}">${likesCount}</span>
      </button>

      <button class="post-action-btn" onclick="toggleComments('${post._id}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${commentsCount}</span>
      </button>
    </div>

    <!-- Comments Section (Hidden by default) -->
    <div id="comments-${post._id}" class="hidden mt-4 pt-4" style="border-top: 1px solid var(--border-color);">
      <div id="comments-list-${post._id}">
        ${renderComments(post.comments || [])}
      </div>
      
      <!-- Add Comment -->
      <div class="comment-input-wrapper mt-3">
        <input 
          type="text" 
          id="comment-input-${post._id}" 
          class="glass-input flex-1 text-sm" 
          placeholder="Write a comment..." 
          onkeypress="if(event.key==='Enter') addComment('${post._id}')"
          style="padding: 10px 14px;"
        />
        <button class="btn-primary text-sm" onclick="addComment('${post._id}')" style="padding: 10px 16px;">
          Post
        </button>
      </div>
    </div>
  `;

  return div;
}

/**
 * Render comments HTML
 */
function renderComments(comments) {
  if (comments.length === 0) {
    return '<p class="text-xs text-center py-4" style="color: var(--text-muted);">No comments yet. Be the first!</p>';
  }

  return comments
    .map(
      (comment) => `
    <div class="comment-item">
      <img src="${comment.author?.profilePicture || DEFAULT_AVATAR}" alt="${comment.author?.name || 'User'}" class="comment-avatar" onerror="this.src='${DEFAULT_AVATAR}'" />
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold" style="color: var(--text-primary);">${escapeHtml(comment.author?.name || "User")}</span>
          <span class="text-xs" style="color: var(--text-muted);">${formatDate(comment.createdAt)}</span>
        </div>
        <p class="text-sm mt-1" style="color: var(--text-secondary);">${escapeHtml(comment.text)}</p>
      </div>
    </div>
  `
    )
    .join("");
}

/**
 * Toggle like on a post
 */
async function toggleLike(postId, btn) {
  try {
    const data = await apiPost(`/posts/${postId}/like`);
    const countEl = document.getElementById(`likes-count-${postId}`);
    
    if (data.liked) {
      btn.classList.add("liked");
      btn.querySelector("svg").setAttribute("fill", "currentColor");
    } else {
      btn.classList.remove("liked");
      btn.querySelector("svg").setAttribute("fill", "none");
    }
    
    countEl.textContent = data.likesCount;
  } catch (error) {
    showToast("Failed to update like", "error");
  }
}

/**
 * Toggle comments section visibility
 */
function toggleComments(postId) {
  const commentsEl = document.getElementById(`comments-${postId}`);
  commentsEl.classList.toggle("hidden");
  if (!commentsEl.classList.contains("hidden")) {
    commentsEl.classList.add("animate-slide-down");
  }
}

/**
 * Add a comment to a post
 */
async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();

  if (!text) return;

  try {
    const data = await apiPost(`/posts/${postId}/comment`, { text });
    
    // Re-render comments
    const commentsList = document.getElementById(`comments-list-${postId}`);
    const comment = data.comment;
    
    // If the list was showing "no comments", clear it
    if (commentsList.querySelector("p")) {
      commentsList.innerHTML = "";
    }

    const commentHtml = `
      <div class="comment-item animate-fade-in">
        <img src="${comment.author?.profilePicture || DEFAULT_AVATAR}" alt="${comment.author?.name || 'User'}" class="comment-avatar" onerror="this.src='${DEFAULT_AVATAR}'" />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold" style="color: var(--text-primary);">${escapeHtml(comment.author?.name || "You")}</span>
            <span class="text-xs" style="color: var(--text-muted);">Just now</span>
          </div>
          <p class="text-sm mt-1" style="color: var(--text-secondary);">${escapeHtml(comment.text)}</p>
        </div>
      </div>
    `;

    commentsList.insertAdjacentHTML("beforeend", commentHtml);
    input.value = "";
    showToast("Comment added!", "success");
  } catch (error) {
    showToast("Failed to add comment", "error");
  }
}

/**
 * Load more posts
 */
document.getElementById("load-more-btn")?.addEventListener("click", () => {
  if (currentPage < totalPages) {
    loadFeed(currentPage + 1);
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
