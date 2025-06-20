const API_URL = 'http://localhost:3000/poll';

async function request(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

export const joinPoll = (code) => request('/enter', {
    method: 'POST',
    body: JSON.stringify({ code }),
});

export const submitResponses = (code, responses) => request(`/${code}/respond`, {
    method: 'POST',
    body: JSON.stringify({ responses }),
});

export const createPoll = (pollData) => request('/create', {
    method: 'POST',
    body: JSON.stringify(pollData),
});

export const getAdminData = (code, adminPassword) => request(`/${code}/admin`, {
    method: 'POST',
    body: JSON.stringify({ adminPassword }),
});

export const togglePollStatus = (code, adminPassword) => request(`/${code}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ adminPassword }),
});
