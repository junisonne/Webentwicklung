/**
 * Poll API Server
 * Provides RESTful endpoints for creating and managing polls with user response tracking
 */
import express from 'express';
import cors from 'cors';

const app = express();
// Enable trusted proxy to get accurate IP addresses behind load balancers
app.set('trust proxy', true);

// Allow cross-origin requests from any domain for ease of development
// Consider restricting in production environment
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let polls = [
    {
        code: "test123",
        title: "Test Umfrage",
        adminPassword: "admin123",
        questions: [
            {
                id: 1,
                question: "Welche Farbe magst du?",
                type: "single",
                options: ["Rot", "Blau", "Grün", "Gelb"]
            }
        ],
        responses: [],
        createdAt: new Date(),
        active: true,
        bannedIPs: []
    }
];

/**
 * Generates a unique 6-character alphanumeric code for new polls
 * Uses base36 encoding (0-9, A-Z) and ensures no collisions with existing poll codes
 */
function generateUniqueCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (polls.find(poll => poll.code === code));
    return code;
}

/**
 * Retrieves a poll by its unique code
 * @param {string} code - The unique poll identifier
 * @returns {Object|undefined} - The poll object if found, undefined otherwise
 */
function findPoll(code) {
    return polls.find(poll => poll.code === code);
}

/**
 * Normalizes an IPv4 address that may be represented in IPv6-mapped format.
 * @param {string} ip - The IP address to normalize.
 * @returns {string} The normalized IPv4 address or the original IP address if no normalization is needed.
 */
function normalizeIP(ip) {
    if (ip && ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }
    return ip;
}

/**
 * Endpoint for users to enter a poll
 * - Tracks participant entry with IP for analytics
 * - Enforces IP banning system to prevent abuse
 * - Returns poll questions only when poll is active
 */
app.post('/poll/enter', (req, res) => {
    const pollCode = req.body.code;
    const poll = findPoll(pollCode);
    // Get IP from various headers to handle proxy situations
    const rawIp = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress || '';

    const ip = normalizeIP(rawIp);
    
    if(req.ip && poll.bannedIPs.includes(ip)) {
        return res.status(403).json({ message: 'Your IP address is banned from entering this poll.' });
    }
    else if(poll.responses.find(entry => entry.ip === ip)) {
        return res.status(400).json({ message: 'You have already entered this poll.' });
    }
    else if (poll && poll.active) {
        res.status(200).json({ 
            message: 'Poll entry successful',
            poll: {
                code: poll.code,
                title: poll.title,
                questions: poll.questions
            }
        });
    } else {
        res.status(404).json({ message: 'Poll not found or inactive' });
    }
});

// ===== POLL MANAGEMENT ENDPOINTS =====

/**
 * Creates a new poll with validation for required fields
 * Automatically assigns a unique code for poll identification
 * Structures questions with proper formatting and defaults
 */
app.post('/poll/create', (req, res) => {
    try {
        const { title, questions, adminPassword } = req.body;
        
        // Input validation to ensure all required data is present
        if (!title || !questions || !adminPassword) {
            return res.status(400).json({ message: 'Title, questions, and admin password are required' });
        }
        
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'At least one question is required' });
        }
        
        const code = generateUniqueCode();
        const newPoll = {
            code,
            title,
            questions: questions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                type: q.type || 'single', // Default to single choice for backward compatibility
                options: q.options || []
            })),
            adminPassword,
            responses: [],
            createdAt: new Date(),
            active: true,
            bannedIPs: []
        };
        
        polls.push(newPoll);
        
        res.status(201).json({ 
            code, 
            message: 'Poll created successfully',
            poll: {
                code: newPoll.code,
                title: newPoll.title,
                questionsCount: newPoll.questions.length
            }
        });
    } catch (error) {
        console.error('Error creating poll:', error);
    }
});

/**
 * Retrieves public poll information for participants
 * Returns 410 Gone if poll has been deactivated
 * Excludes sensitive data like admin password and IP addresses
 */
app.get('/poll/:code', (req, res) => {
    try {
        const poll = findPoll(req.params.code);
        
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        
        if (!poll.active) {
            return res.status(410).json({ message: 'Poll is no longer active' });
        }
        
        res.json({
            code: poll.code,
            title: poll.title,
            questions: poll.questions,
            responseCount: poll.responses.length
        });
    } catch (error) {
        console.error('Error creating poll:', error);
    }
});

/**
 * Records a participant's responses to a poll
 * Validates that all questions are answered and responses match the expected format
 * Records IP address for preventing duplicate submissions
 */
app.post('/poll/:code/respond', (req, res) => {
    try {
        const { responses } = req.body;
        const poll = findPoll(req.params.code);
        
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        
        if (!poll.active) {
            return res.status(410).json({ message: 'Poll is no longer active' });
        }
        
        if (!responses || !Array.isArray(responses)) {
            return res.status(400).json({ message: 'Responses must be an array' });
        }
        
        if (responses.length !== poll.questions.length) {
            return res.status(400).json({ message: 'Response count must match question count' });
        }

        const rawIp = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.socket.remoteAddress || '';
        const ip = normalizeIP(rawIp);
        
        const newResponse = {
            id: poll.responses.length + 1,
            responses,
            ip: ip,
            timestamp: new Date()
        };
        
        poll.responses.push(newResponse);
        
        res.json({ 
            message: 'Response recorded successfully',
            responseId: newResponse.id
        });
    } catch (error) {
       console.error('Error creating poll:', error);
    }
});

/**
 * Admin endpoint to retrieve poll with detailed results and participation metrics
 * Requires admin password authentication for security
 * Aggregates and transforms raw response data into actionable statistics
 */
app.post('/poll/:code/admin', (req, res) => {
    try {
        const { adminPassword } = req.body;
        const poll = findPoll(req.params.code);
        
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        
        if (poll.adminPassword !== adminPassword) {
            return res.status(401).json({ message: 'Invalid admin password' });
        }
        const participantEntries = poll.responses.map(res => ({
            ip: res.ip,
            timestamp: res.timestamp,
        }));
        
        // Calculate aggregated results from individual responses
        const results = poll.questions.map(question => {
            const questionResponses = poll.responses.map(r => r.responses[question.id - 1]);
            const optionCounts = {};
            
            question.options.forEach(option => {
                optionCounts[option] = 0;
            });
            
            questionResponses.forEach(response => {
                if (question.type === 'single') {
                    if (response && optionCounts.hasOwnProperty(response)) {
                        optionCounts[response]++;
                    }
                } else if (question.type === 'multiple' && Array.isArray(response)) {
                    response.forEach(answer => {
                        if (optionCounts.hasOwnProperty(answer)) {
                            optionCounts[answer]++;
                        }
                    });
                }
            });
            
            
            return {
                questionId: question.id,
                question: question.question,
                type: question.type,
                options: question.options,
                results: optionCounts,
                totalResponses: poll.responses.length,
            };
        });
        
        res.json({
            poll: {
                code: poll.code,
                title: poll.title,
                active: poll.active,
                createdAt: poll.createdAt,
                totalResponses: poll.responses.length,
                bannedIPs: poll.bannedIPs
            },
            results,
            participantEntries
        });
    } catch (error) {
        console.error('Error creating poll:', error);
    }
});

/**
 * Admin endpoint to toggle poll active status
 * Enables administrators to activate/deactivate polls when needed
 * Returns the new active state for UI feedback
 */
app.put('/poll/:code/toggle', (req, res) => {
    try {
        const { adminPassword } = req.body;
        const poll = findPoll(req.params.code);
        
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        
        if (poll.adminPassword !== adminPassword) {
            return res.status(401).json({ message: 'Invalid admin password' });
        }
        
        poll.active = !poll.active;
        
        res.json({ 
            message: `Poll ${poll.active ? 'activated' : 'deactivated'} successfully`,
            active: poll.active
        });
    } catch (error) {
        console.error('Error creating poll:', error);
    }
});

/**
 * Public endpoint to list all available polls
 * Used in the frontend to display polls that users can access
 * Security consideration: Currently exposes adminPassword which should be removed in production
 */
app.get('/polls', (req, res) => {
    const pollsOverview = polls.map(poll => ({
        code: poll.code,
        title: poll.title,
        active: poll.active,
        createdAt: poll.createdAt,
        responseCount: poll.responses.length,
        questionCount: poll.questions.length,
        adminPassword: poll.adminPassword, // TODO: Remove in production for security
    }));
    
    res.json({ polls: pollsOverview });
});

/**
 * Adds an IP address to the ban list for a specific poll
 * Used to prevent abuse or multiple submissions from the same source
 */
app.post('/poll/ban', (req, res) => {
    const { code } = req.body;
    const poll = findPoll(code);

    const rawIp = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress || '';
    const ip = normalizeIP(rawIp);

    
    if (!ip) {
        return res.status(400).json({ message: 'IP address is required' });
    }
    
    if (!poll.bannedIPs.includes(ip)) {
        poll.bannedIPs.push(ip);
        poll.responses = poll.responses.filter(response => response.ip !== ip);
        res.json({ message: `IP ${ip} has been banned from entering poll ${code}` });
    } else {
        res.status(400).json({ message: `IP ${ip} is already banned` });
    }
});

/**
 * Removes an IP address from the ban list for a specific poll
 * Provides control over ban management for poll administrators
 */
app.post('/poll/unban', (req, res) => {
    const { code } = req.body;
    const poll = findPoll(code);

    const rawIp = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress || '';
    const ip = normalizeIP(rawIp);

    if (!ip) {
        return res.status(400).json({ message: 'IP address is required' });
    }
    
    const bannedIndex = poll.bannedIPs.indexOf(ip);

    if (bannedIndex > -1) {
        poll.bannedIPs.splice(bannedIndex, 1);
        res.json({ message: `IP ${ip} has been unbanned` });
    } else {
        res.status(400).json({ message: `IP ${ip} is not banned` });
    }
});

// Static files (für deine HTML/JS files)
app.use(express.static('.'));

// Für den redirect zu index.html falls unbekannte url
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

const PORT = process.env.PORT || 8500;
const HOST = process.env.HOST || 'http://localhost';
app.listen(PORT, () => {
    console.log(`🚀 Poll Server running on port ${PORT}`);
    console.log(`📊 Test poll available at: ${HOST}:${PORT}/poll/test123`);
    console.log(`📝 All polls overview: ${HOST}:${PORT}/polls`);
});

export default app;