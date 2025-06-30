const API_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
    console.log(`API Request: ${API_URL}${endpoint}`, options);
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        console.log(`API Response: ${response.status} ${response.statusText}`);
        console.log(response);
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.message || 'An error occurred');
            error.status = response.status;
            throw error;
        }
        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
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

export const banIP = (ip) => request('/poll/ban', {
    method: 'POST',
    body: JSON.stringify({ ip }),
});

export const getAllPolls = () => request('/polls', {
    method: 'GET',
});