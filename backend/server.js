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

let polls = [{code: "test"}];
let pollEntries = [];

app.post('/poll/enter', (req, res) => {
    const pollCode = req.body.code;
    if (polls.find(poll => poll.code === pollCode)) {
        pollEntries.push({ code: pollCode, ip: req.ip, timestamp: new Date() }); 
        res.status(200).json({ message: 'Poll entry successful'});
    }
    else res.json({ message: 'Poll entry not successful' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});