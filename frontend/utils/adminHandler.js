import * as templates from "../templates.js";
import * as api from "../api.js";

/**
 * Refreshes only the results section without reloading the entire admin panel
 * @param {HTMLElement} shadowRoot - Shadow root to access DOM elements
 * @param {string} pollCode - Poll code to fetch updated data
 * @param {string} adminPassword - Admin password for authentication
 */
export async function handleRefreshResults(shadowRoot, pollCode, adminPassword) {
    if (!adminPassword) {
        adminPassword = prompt("Enter admin password:");
        if (!adminPassword) return;
    }
    const refreshButton = shadowRoot.getElementById("refreshResults");
    const originalText = refreshButton.textContent;
    refreshButton.textContent = "Refreshing...";
    refreshButton.disabled = true;

    try {
        const data = await api.getAdminData(pollCode, adminPassword);
        updateResultsSection(shadowRoot, data.results);
        updatePollMetadata(shadowRoot, data.poll);
    } catch (error) {
        const messageEl = shadowRoot.getElementById("message");
        if (messageEl) {
            messageEl.innerHTML = `<div id="error-results" class="message-container" aria-live="polite">${error.message}</div>`;
        }
    } finally {
        refreshButton.textContent = originalText;
        refreshButton.disabled = false;
    }
}

/**
 * Updates the visual width of result bars based on their percentage data attributes
 * @param {HTMLElement} shadowRoot - Shadow root to access DOM elements
 */
export function updateResultBars(shadowRoot) {
    shadowRoot.querySelectorAll(".result-bar").forEach((bar) => {
            const percentage = bar.getAttribute("data-percentage");
            if (percentage) {
                bar.querySelector(".result-fill").style.width = `${percentage}%`;
            }
        });
}

/**
 * Generates a QR code for easy poll access on mobile devices
 * Contains the poll join URL with poll code parameter
 * @param {HTMLElement} shadowRoot - Shadow root to access DOM elements
 * @param {string} pollCode - The poll code to include in the QR code URL
 */
export function generateQRCode(shadowRoot, pollCode) {
    const url = new URL(window.location.href);
    url.searchParams.append("code", pollCode);
    const qrTarget = url.toString();
    const canvas = shadowRoot.getElementById("qrcode");

    if (canvas && window.QRCode) {
      QRCode.toCanvas(canvas, qrTarget, { width: 200 }, (error) => {
        if (error) console.error("QR-Code Fehler:", error);
      });
    }
}
/**
 * Updates only the poll status section (active/inactive) in the DOM
 * @param {HTMLElement} shadowRoot - Shadow root to access DOM elements
 * @param {Object} poll - Updated poll data with new status
 */
export function updatePollStatus(shadowRoot, poll) {
    updatePollMetadata(shadowRoot, poll);

    const toggleButton = shadowRoot.getElementById("togglePoll");
    if (toggleButton) {
        toggleButton.textContent = poll.active ? "Deactivate Poll" : "Activate Poll";
    }
}

/**
 * Updates only the results section in the DOM without affecting other admin panel elements
 * Replaces the results container content and re-applies result bar styling
 * @param {HTMLElement} shadowRoot - Shadow root to access DOM elements
 * @param {Array} results - Updated results data containing question results with vote counts
 */
function updateResultsSection(shadowRoot, results) {
    const resultsContainer = shadowRoot.querySelector(".results-container-wrapper");
        if (resultsContainer) {

        const resultsHTML = results.map(templates.getResultTemplate).join("");
        resultsContainer.innerHTML = resultsHTML;

        updateResultBars(shadowRoot);
    }
}

/**
 * Updates the poll metadata display including code, status, and response count
 * Refreshes the poll information section without affecting other admin panel components
 * @param {HTMLElement} shadowRoot - Shadow root to access DOM elements
 * @param {Object} poll - Updated poll data containing code, active status and total responses
 */
function updatePollMetadata(shadowRoot, poll) {
    const metadataContainer = shadowRoot.querySelector(".poll-metadata");
    if (metadataContainer) {
        metadataContainer.innerHTML = `
            <p>Code: <span class="highlight">${poll.code}</span> | Status: 
            ${poll.active ? "🟢 Active" : "🔴 Inactive"}</p>
            <p>Total Responses: <span class="highlight">
            ${poll.totalResponses}</span></p>
        `;
    }
}

