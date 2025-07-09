import * as api from "../api.js";
import * as templates from "../templates.js";

/**
 * Validates IP address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IP format
 */
function validateIPAddress(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Updates only the banned IPs list without refreshing the entire admin panel
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {Array} bannedIPs - Updated array of banned IP addresses
 * @param {string} currentPollCode - Current poll code for event binding
 * @param {string} adminPassword - Admin password for authentication
 */
export function updateBannedIPsList(shadowRoot, bannedIPs, currentPollCode, adminPassword) {
  const bannedIPsList = shadowRoot.getElementById("bannedIPsList");
  if (bannedIPsList) {
    bannedIPsList.innerHTML = templates.getBannedIPsListTemplate(bannedIPs);
    
    // Re-bind unban button event listeners
    shadowRoot.querySelectorAll(".unban-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const ip = e.target.dataset.ip;
        if (confirm(`Are you sure you want to unban IP: ${ip}?`)) {
          handleUnbanIP(shadowRoot, ip, currentPollCode, adminPassword);
        }
      });
    });
  }
}

/**
 * Handles banning a new IP address from the admin input form
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {string} pollCode - Poll code to ban IP from
 * @param {string} adminPassword - Admin password for authentication
 */
export async function handleBanNewIP(shadowRoot, pollCode, adminPassword) {
  const ipInput = shadowRoot.getElementById("ipToBan");
  const messageEl = shadowRoot.getElementById("banIPMessage");
  const ip = ipInput.value.trim();

  if (!ip) {
    messageEl.innerHTML = '<div class="error">Please enter an IP address</div>';
    return;
  }

  if (!validateIPAddress(ip)) {
    messageEl.innerHTML = '<div class="error">Please enter a valid IP address</div>';
    return;
  }

  try {
    messageEl.innerHTML = '<div class="loading">Banning IP...</div>';
    const data = await api.banIP(ip, pollCode);
    messageEl.innerHTML = `<div class="success">${data.message}</div>`;
    ipInput.value = "";
    const updatedData = await api.getAdminData(pollCode, adminPassword);
    updateBannedIPsList(shadowRoot, updatedData.poll.bannedIPs, pollCode, adminPassword);
  } catch (error) {
    messageEl.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

/**
 * Handles banning an IP address from the participant list
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {string} ip - IP address to ban
 * @param {string} pollCode - Poll code to ban IP from
 * @param {string} adminPassword - Admin password for authentication
 */
async function handleBanIP(shadowRoot, ip, pollCode, adminPassword) {
  const messageEl = shadowRoot.getElementById("banMessage");
  
  try {
    messageEl.innerHTML = '<div class="loading">Banning IP...</div>';
    const data = await api.banIP(ip, pollCode);
    messageEl.innerHTML = `<div class="success">${data.message}</div>`;

    // Get updated poll data and update only the banned IPs list
    const updatedData = await api.getAdminData(pollCode, adminPassword);
    updateBannedIPsList(shadowRoot, updatedData.poll.bannedIPs, pollCode, adminPassword);
  } catch (error) {
    messageEl.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

/**
 * Handles unbanning an IP address
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {string} ip - IP address to unban
 * @param {string} pollCode - Poll code to unban IP from
 * @param {string} adminPassword - Admin password for authentication
 */
async function handleUnbanIP(shadowRoot, ip, pollCode, adminPassword) {
  try {
    const data = await api.unbanIP(ip, pollCode);

    const messageEl =
      shadowRoot.getElementById("banIPMessage") ||
      shadowRoot.getElementById("banMessage");
    if (messageEl) {
      messageEl.innerHTML = `<div class="success">${data.message}</div>`;
    }

    // Get updated poll data and update only the banned IPs list
    const updatedData = await api.getAdminData(pollCode, adminPassword);
    updateBannedIPsList(shadowRoot, updatedData.poll.bannedIPs, pollCode, adminPassword);
  } catch (error) {
    const messageEl =
      shadowRoot.getElementById("banIPMessage") ||
      shadowRoot.getElementById("banMessage");
    if (messageEl) {
      messageEl.innerHTML = `<div class="error">${error.message}</div>`;
    }
  }
}

/**
 * Sets up IP management event listeners for the admin panel
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {Object} data - Poll data containing participant entries and banned IPs
 * @param {string} adminPassword - Admin password for authentication
 */
export function setupIPEventListeners(shadowRoot, data, adminPassword) {
  // Set up ban buttons for participant IPs
  shadowRoot.querySelectorAll(".ban-ip-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const ip = e.target.dataset.ip;
      if (confirm(`Are you sure you want to ban IP: ${ip}?`)) {
        handleBanIP(shadowRoot, ip, data.poll.code, adminPassword);
      }
    });
  });

  // Set up unban buttons for banned IPs
  shadowRoot.querySelectorAll(".unban-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const ip = e.target.dataset.ip;
      if (confirm(`Are you sure you want to unban IP: ${ip}?`)) {
        handleUnbanIP(shadowRoot, ip, data.poll.code, adminPassword);
      }
    });
  });
}
