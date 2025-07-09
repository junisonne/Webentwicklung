// pollOverviewHandler.js - Handles poll overview interactions and search functionality

import * as templates from "../templates.js";

/**
 * Handles admin access form submissions for poll entries
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {Array} polls - Array of poll objects
 * @param {Object} state - Component state object
 * @param {Function} showAdminPanel - Callback to show admin panel
 */
export function handleEnterAsAdmin(shadowRoot, polls, state, showAdminPanel) {
  shadowRoot.querySelectorAll(".admin-access-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pollItem = form.closest(".poll-item");
      const button = form.querySelector(".join-poll-btn");
      const pollCode = button.dataset.code;
      const adminInput = form.querySelector(".admin-code-input").value;

      if (!adminInput) {
        const messageEl = pollItem.querySelector(".message-container");
        if (messageEl) {
          messageEl.innerHTML =
            '<div class="error">Please enter admin password</div>';
        }
        return;
      } else {
        const poll = polls.find((p) => p.code === pollCode);
        if (poll.adminPassword === adminInput) {
          state.adminPassword = adminInput;
          showAdminPanel(pollCode);
        } else {
          console.error("Invalid admin password for poll:", pollCode);
          const messageEl = pollItem.querySelector(".message-container");
          if (messageEl) {
            messageEl.innerHTML =
              '<div class="error">Invalid admin password</div>';
          }
        }
      }
    });
    form.addEventListener("reset", (e) => {
      e.preventDefault();
      const pollItem = form.closest(".poll-item");
      const messageEl = pollItem.querySelector(".message-container");
      if (messageEl) {
        messageEl.innerHTML = "";
      }
    });
  });
}

/**
 * Handles poll search functionality
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {Array} polls - Array of poll objects
 * @param {Object} state - Component state object
 * @param {Function} showAdminPanel - Callback to show admin panel
 */
export function handleSearchPolls(shadowRoot, polls, state, showAdminPanel) {
  shadowRoot.querySelectorAll(".poll-search-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const searchInput = shadowRoot.getElementById("pollSearchInput");
      const searchTerm = searchInput.value.trim().toLowerCase();

      const newPolls = polls.filter((poll) => {
        const titleMatch = poll.title.toLowerCase().includes(searchTerm);
        const codeMatch = poll.code.toLowerCase().includes(searchTerm);
        return titleMatch || codeMatch;
      });

      const pollListContainer = shadowRoot.querySelector(".poll-list");
      if (pollListContainer) {
        pollListContainer.innerHTML = templates.getPollListItemsTemplate(newPolls);
        handleEnterAsAdmin(shadowRoot, newPolls, state, showAdminPanel);
        handleSearchPolls(shadowRoot, polls, state, showAdminPanel);
      }
    });

    form.addEventListener("reset", (e) => {
      e.preventDefault();
      const pollListContainer = shadowRoot.querySelector(".poll-list");
      if (pollListContainer) {
        pollListContainer.innerHTML = templates.getPollListItemsTemplate(polls);
        handleEnterAsAdmin(shadowRoot, polls, state, showAdminPanel);
        handleSearchPolls(shadowRoot, polls, state, showAdminPanel);
      }
    });
  });
}
