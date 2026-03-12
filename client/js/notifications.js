/**
 * Notifications Page Logic
 * Loads notifications, handles skill matching, and mark-as-read
 */

requireAuth(async (firebaseUser) => {
  await loadNotifications();
});

// Logout handler
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await firebase.auth().signOut();
  window.location.href = "/index.html";
});

/**
 * Load notifications from the API
 */
async function loadNotifications() {
  try {
    const data = await apiGet("/ai/notifications");
    const loadingEl = document.getElementById("notifications-loading");
    const listEl = document.getElementById("notifications-list");
    const emptyEl = document.getElementById("no-notifications");
    const markReadBtn = document.getElementById("mark-read-btn");

    loadingEl.classList.add("hidden");

    if (data.notifications.length === 0) {
      emptyEl.classList.remove("hidden");
      return;
    }

    listEl.classList.remove("hidden");

    // Show mark-read button if there are unread notifications
    if (data.unreadCount > 0) {
      markReadBtn.classList.remove("hidden");
    }

    listEl.innerHTML = data.notifications
      .map((notif, index) => {
        const avatar = notif.relatedUser?.profilePicture || DEFAULT_AVATAR;
        const userName = notif.relatedUser?.name || "Someone";
        const timeAgo = formatDate(notif.createdAt);
        const isUnread = !notif.isRead;

        // Choose icon based on notification type
        let icon = "🔔";
        let iconClass = "";
        if (notif.type === "skill_match") {
          icon = "🤝";
          iconClass = "skill-match";
        } else if (notif.type === "connection_suggestion") {
          icon = "💡";
        }

        return `
          <div class="notification-item ${isUnread ? "unread" : ""} animate-fade-in-up" style="animation-delay: ${index * 0.05}s; opacity: 0;">
            <div class="notification-icon ${iconClass}">
              ${icon}
            </div>
            <div class="flex-1">
              <div class="flex items-start gap-3">
                <img src="${avatar}" alt="${userName}" class="w-10 h-10 rounded-full object-cover flex-shrink-0" onerror="this.src='${DEFAULT_AVATAR}'" style="border: 1px solid var(--border-color);" />
                <div class="flex-1">
                  <p class="text-sm leading-relaxed" style="color: var(--text-primary);">
                    ${escapeHtml(notif.message)}
                  </p>
                  ${notif.matchedSkill ? `
                    <span class="skill-tag text-xs mt-2 inline-block">${escapeHtml(notif.matchedSkill)}</span>
                  ` : ""}
                  <p class="text-xs mt-2" style="color: var(--text-muted);">${timeAgo}</p>
                </div>
              </div>
            </div>
            ${isUnread ? '<div class="w-2 h-2 rounded-full flex-shrink-0 mt-2" style="background: var(--primary);"></div>' : ""}
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load notifications error:", error);
    document.getElementById("notifications-loading").classList.add("hidden");
    showToast("Failed to load notifications", "error");
  }
}

/**
 * Find skill matches manually
 */
document.getElementById("find-matches-btn")?.addEventListener("click", async () => {
  const btn = document.getElementById("find-matches-btn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Searching...";

  try {
    const data = await apiPost("/ai/skill-match");

    if (data.matchCount > 0) {
      showToast(
        `Found ${data.matchCount} skill match${data.matchCount > 1 ? "es" : ""}! 🎯`,
        "success"
      );
      // Reload notifications to show new matches
      await loadNotifications();
    } else {
      showToast(
        "No new matches found. Try adding more skills to your profile!",
        "info"
      );
    }
  } catch (error) {
    showToast(error.message || "Failed to search for matches", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

/**
 * Mark all notifications as read
 */
document.getElementById("mark-read-btn")?.addEventListener("click", async () => {
  try {
    await apiPut("/ai/notifications/mark-read");
    showToast("All notifications marked as read", "success");

    // Remove unread indicators
    document.querySelectorAll(".notification-item.unread").forEach((el) => {
      el.classList.remove("unread");
    });
    document.querySelectorAll(".notification-item .w-2.h-2").forEach((el) => {
      el.remove();
    });
    document.getElementById("mark-read-btn").classList.add("hidden");
  } catch (error) {
    showToast("Failed to mark as read", "error");
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
