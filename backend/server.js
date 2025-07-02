import express from 'express';
import cors from 'cors';

const app = express();
app.set('trust proxy', true);

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

let pollEntries = [];

function generateUniqueCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (polls.find(poll => poll.code === code));
    return code;
}

function findPoll(code) {
    return polls.find(poll => poll.code === code);
}

// ===== EXISTING ENDPOINT =====
app.post('/poll/enter', (req, res) => {
    const pollCode = req.body.code;
    const poll = findPoll(pollCode);
    const ip = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress || '';
    
    if(req.ip && poll.bannedIPs.includes(ip)) {
        return res.status(403).json({ message: 'Your IP address is banned from entering this poll.' });
    }
    else if (poll && poll.active) {
        pollEntries.push({ 
            code: pollCode, 
            ip: ip,
            timestamp: new Date() 
        });
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

// ===== NEW ENDPOINTS =====

// 1. CREATE POLL (Admin)
app.post('/poll/create', (req, res) => {
    try {
        const { title, questions, adminPassword } = req.body;
        
        // Validation
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
                type: q.type || 'single', // default to single choice
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 2. GET POLL DETAILS (Public - without admin info)
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. SUBMIT RESPONSE
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
        
        // Validate responses match questions
        if (responses.length !== poll.questions.length) {
            return res.status(400).json({ message: 'Response count must match question count' });
        }
        
        const newResponse = {
            id: poll.responses.length + 1,
            responses,
            ip: req.ip,
            timestamp: new Date()
        };
        
        poll.responses.push(newResponse);
        
        res.json({ 
            message: 'Response recorded successfully',
            responseId: newResponse.id
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. ADMIN - GET POLL WITH RESULTS
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
        const participantEntries = pollEntries.filter(entry => entry.code === req.params.code);
        
        // Calculate results
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 5. ADMIN - TOGGLE POLL STATUS
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 6. GET ALL POLLS (Debug/Overview)
app.get('/polls', (req, res) => {
    const pollsOverview = polls.map(poll => ({
        code: poll.code,
        title: poll.title,
        active: poll.active,
        createdAt: poll.createdAt,
        responseCount: poll.responses.length,
        questionCount: poll.questions.length,
        adminPassword: poll.adminPassword,
    }));
    
    res.json({ polls: pollsOverview });
});

app.post('/poll/ban', (req, res) => {
    const { ip, code } = req.body;
    const poll = findPoll(code);

    
    if (!ip) {
        return res.status(400).json({ message: 'IP address is required' });
    }
    
    if (!poll.bannedIPs.includes(ip)) {
        poll.bannedIPs.push(ip);
        res.json({ message: `IP ${ip} has been banned from entering poll ${code}` });
    } else {
        res.status(400).json({ message: `IP ${ip} is already banned` });
    }
});

// Unban IP address
app.post('/poll/unban', (req, res) => {
    const { ip, code } = req.body;
    const poll = findPoll(code);

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



if (process.env.NODE_ENV !== 'test') { //For the server.test.js to work, because there was an TypeError: app.address is not a function
  const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`🚀 Poll Server running on port ${PORT}`);
    console.log(`📊 Test poll available at: http://localhost:${PORT}/poll/test123`);
    console.log(`📝 All polls overview: http://localhost:${PORT}/polls`);
});
}

export default app;