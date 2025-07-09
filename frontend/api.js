let API_URL = `http://localhost:3000`;

/**
 * @param {string} url - Sets the base URL for API requests
 */
export function setApiUrl(url) { API_URL = url; }

/**
 * Generic request handler
 * 
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options including method, body, headers
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} Enhanced error with status code for better UI feedback
 */
async function request(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.message || 'An error occurred');
            error.status = response.status;
            throw error;
        }
        return data;
    } catch (error) {
        throw error;
    }
}

export const joinPoll = (code) => request('/poll/enter', {
    method: 'POST',
    body: JSON.stringify({ code }),
});

export const submitResponses = (code, responses) => request(`/poll/${code}/respond`, {
    method: 'POST',
    body: JSON.stringify({ responses }),
});

export const createPoll = (pollData) => request('/poll/create', {
    method: 'POST',
    body: JSON.stringify(pollData),
});

export const getAdminData = (code, adminPassword) => request(`/poll/${code}/admin`, {
    method: 'POST',
    body: JSON.stringify({ adminPassword }),
});

export const togglePollStatus = (code, adminPassword) => request(`/poll/${code}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ adminPassword }),
});

export const banIP = (ip, code) => request('/poll/ban', {
    method: 'POST',
    body: JSON.stringify({ ip, code }),
});

export const unbanIP = (ip, code) => request('/poll/unban', {
    method: 'POST',
    body: JSON.stringify({ ip, code }),
});

export const getAllPolls = () => request('/polls', {
    method: 'GET',
});