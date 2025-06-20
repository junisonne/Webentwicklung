const pollStyles = new CSSStyleSheet();
pollStyles.replaceSync(`
:host {
    font-family: Arial, sans-serif;
}

main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
}

.container {
    text-align: center;
    background-color: #f8f9fa;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
}

h1 {
    color: #333;
    margin-bottom: 20px;
}

h2 {
    color: #555;
    margin-bottom: 15px;
}

input[type="text"], input[type="password"] {
    padding: 12px;
    margin: 8px;
    width: 250px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
}

input:focus {
    outline: none;
    border-color: #007BFF;
}

button {
    padding: 12px 20px;
    margin: 8px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    min-width: 120px;
}

button:hover {
    background-color: #0056b3;
}

button.secondary {
    background-color: #6c757d;
}

button.secondary:hover {
    background-color: #545b62;
}

.question-container {
    margin: 20px 0;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    text-align: left;
}

.question-title {
    font-weight: bold;
    margin-bottom: 12px;
    color: #333;
}

.option-button {
    display: block;
    width: 100%;
    margin: 8px 0;
    padding: 12px;
    background-color: white;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
}

.option-button:hover {
    border-color: #007BFF;
    background-color: #f8f9fa;
}

.option-button.selected {
    background-color: #007BFF;
    color: white;
    border-color: #007BFF;
}

.option-button.multiple.selected {
    background-color: #28a745;
    border-color: #28a745;
}

.results-container {
    margin: 15px 0;
    padding: 15px;
    background-color: white;
    border-radius: 8px;
}

.result-bar {
    margin: 8px 0;
    padding: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    position: relative;
}

.result-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: #007BFF;
    border-radius: 4px;
    transition: width 0.5s ease;
}

.result-text {
    position: relative;
    z-index: 1;
    color: #333;
    font-weight: 500;
}

.loading {
    color: #666;
    font-style: italic;
}

.error {
    color: #dc3545;
    background-color: #f8d7da;
    padding: 12px;
    border-radius: 6px;
    margin: 10px 0;
}

.success {
    color: #155724;
    background-color: #d4edda;
    padding: 12px;
    border-radius: 6px;
    margin: 10px 0;
}

.back-button {
    background-color: #6c757d;
    margin-top: 20px;
}

.back-button:hover {
    background-color: #545b62;
}

.admin-controls {
    margin-top: 20px;
    padding: 20px;
    background-color: #fff3cd;
    border-radius: 8px;
}

.poll-info {
    margin: 15px 0;
    padding: 15px;
    background-color: #d1ecf1;
    border-radius: 8px;
    color: #0c5460;
}
`);

class Poll extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [pollStyles];
        
        // State
        this.currentPoll = null;
        this.userResponses = [];
        this.isAdmin = false;
        this.adminPassword = null;
        
        this.showMainMenu();
    }

    showMainMenu() {
        this.shadowRoot.innerHTML = `
            <main>
                <div class="container">
                    <h1>📊 Poll System</h1>
                    <button id="joinPoll">Join Poll</button>
                    <button id="createPoll" class="secondary">Create Poll (Admin)</button>
                </div>
            </main>
        `;
        
        this.shadowRoot.getElementById('joinPoll').addEventListener('click', () => this.showJoinPoll());
        this.shadowRoot.getElementById('createPoll').addEventListener('click', () => this.showCreatePoll());
    }

    showJoinPoll() {
        this.shadowRoot.innerHTML = `
            <main>
                <div class="container">
                    <h1>Join Poll</h1>
                    <input type="text" id="pollCode" placeholder="Enter Poll Code" />
                    <br>
                    <button id="enterPoll">Join Poll</button>
                    <button id="backToMenu" class="back-button">Back</button>
                    <div id="message"></div>
                </div>
            </main>
        `;
        
        this.shadowRoot.getElementById('enterPoll').addEventListener('click', () => this.joinPoll());
        this.shadowRoot.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
    }

    async joinPoll() {
        const pollCode = this.shadowRoot.getElementById('pollCode').value;
        const messageEl = this.shadowRoot.getElementById('message');
        
        if (!pollCode) {
            messageEl.innerHTML = '<div class="error">Please enter a poll code.</div>';
            return;
        }

        messageEl.innerHTML = '<div class="loading">Loading poll...</div>';

        try {
            const response = await fetch(`http://localhost:3000/poll/enter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: pollCode })
            });

            const data = await response.json();

            if (response.ok && data.poll) {
                this.currentPoll = data.poll;
                this.userResponses = new Array(data.poll.questions.length);
                this.showPollQuestions();
            } else {
                messageEl.innerHTML = `<div class="error">${data.message}</div>`;
            }
        } catch (error) {
            messageEl.innerHTML = '<div class="error">Connection error. Please try again.</div>';
        }
    }

    showPollQuestions() {
        let questionsHTML = '';
        
        this.currentPoll.questions.forEach((question, index) => {
            const optionsHTML = question.options.map(option => 
                `<button class="option-button" data-question="${index}" data-option="${option}">
                    ${option}
                </button>`
            ).join('');
            
            questionsHTML += `
                <div class="question-container">
                    <div class="question-title">
                        ${index + 1}. ${question.question}
                        <small style="color: #666;">(${question.type === 'single' ? 'Single choice' : 'Multiple choice'})</small>
                    </div>
                    ${optionsHTML}
                </div>
            `;
        });

        this.shadowRoot.innerHTML = `
            <main>
                <div class="container">
                    <h1>${this.currentPoll.title}</h1>
                    ${questionsHTML}
                    <button id="submitResponses">Submit Responses</button>
                    <button id="backToMenu" class="back-button">Back to Menu</button>
                    <div id="message"></div>
                </div>
            </main>
        `;

        // Add click handlers for options
        this.shadowRoot.querySelectorAll('.option-button').forEach(button => {
            button.addEventListener('click', (e) => this.selectOption(e));
        });

        this.shadowRoot.getElementById('submitResponses').addEventListener('click', () => this.submitResponses());
        this.shadowRoot.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
    }

    selectOption(event) {
        const questionIndex = parseInt(event.target.dataset.question);
        const option = event.target.dataset.option;
        const question = this.currentPoll.questions[questionIndex];

        if (question.type === 'single') {
            // Single choice - deselect others for this question
            this.shadowRoot.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('selected');
            });
            event.target.classList.add('selected');
            this.userResponses[questionIndex] = option;
        } else {
            // Multiple choice
            event.target.classList.toggle('selected');
            event.target.classList.toggle('multiple');
            
            if (!this.userResponses[questionIndex]) {
                this.userResponses[questionIndex] = [];
            }
            
            const selectedOptions = this.userResponses[questionIndex];
            const optionIndex = selectedOptions.indexOf(option);
            
            if (optionIndex > -1) {
                selectedOptions.splice(optionIndex, 1);
            } else {
                selectedOptions.push(option);
            }
        }
    }

    async submitResponses() {
        const messageEl = this.shadowRoot.getElementById('message');
        
        // Check if all questions are answered
        const unanswered = this.userResponses.some((response, index) => {
            if (this.currentPoll.questions[index].type === 'multiple') {
                return !response || response.length === 0;
            }
            return !response;
        });

        if (unanswered) {
            messageEl.innerHTML = '<div class="error">Please answer all questions.</div>';
            return;
        }

        messageEl.innerHTML = '<div class="loading">Submitting responses...</div>';

        try {
            const response = await fetch(`http://localhost:3000/poll/${this.currentPoll.code}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: this.userResponses })
            });

            const data = await response.json();

            if (response.ok) {
                messageEl.innerHTML = '<div class="success">Thank you! Your responses have been recorded.</div>';
                setTimeout(() => this.showMainMenu(), 2000);
            } else {
                messageEl.innerHTML = `<div class="error">${data.message}</div>`;
            }
        } catch (error) {
            messageEl.innerHTML = '<div class="error">Connection error. Please try again.</div>';
        }
    }

    showCreatePoll() {
        this.shadowRoot.innerHTML = `
            <main>
                <div class="container">
                    <h1>Create New Poll</h1>
                    <input type="text" id="pollTitle" placeholder="Poll Title" />
                    <input type="password" id="adminPassword" placeholder="Admin Password" />
                    
                    <h2>Questions</h2>
                    <div id="questionsContainer">
                        <div class="question-builder">
                            <input type="text" placeholder="Question 1" class="question-input" />
                            <select class="question-type">
                                <option value="single">Single Choice</option>
                                <option value="multiple">Multiple Choice</option>
                            </select>
                            <div class="options-container">
                                <input type="text" placeholder="Option 1" class="option-input" />
                                <input type="text" placeholder="Option 2" class="option-input" />
                            </div>
                            <button type="button" class="add-option secondary">+ Add Option</button>
                        </div>
                    </div>
                    
                    <button id="addQuestion" class="secondary">+ Add Question</button>
                    <br>
                    <button id="createPollBtn">Create Poll</button>
                    <button id="backToMenu" class="back-button">Back</button>
                    <div id="message"></div>
                </div>
            </main>
        `;

        this.shadowRoot.getElementById('addQuestion').addEventListener('click', () => this.addQuestion());
        this.shadowRoot.getElementById('createPollBtn').addEventListener('click', () => this.createPoll());
        this.shadowRoot.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
        
        // Add option functionality for first question
        this.shadowRoot.querySelector('.add-option').addEventListener('click', (e) => this.addOption(e));
    }

    addQuestion() {
        const container = this.shadowRoot.getElementById('questionsContainer');
        const questionCount = container.children.length + 1;
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-builder';
        questionDiv.innerHTML = `
            <input type="text" placeholder="Question ${questionCount}" class="question-input" />
            <select class="question-type">
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
            </select>
            <div class="options-container">
                <input type="text" placeholder="Option 1" class="option-input" />
                <input type="text" placeholder="Option 2" class="option-input" />
            </div>
            <button type="button" class="add-option secondary">+ Add Option</button>
        `;
        
        container.appendChild(questionDiv);
        questionDiv.querySelector('.add-option').addEventListener('click', (e) => this.addOption(e));
    }

    addOption(event) {
        const optionsContainer = event.target.previousElementSibling;
        const optionCount = optionsContainer.children.length + 1;
        
        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.placeholder = `Option ${optionCount}`;
        optionInput.className = 'option-input';
        
        optionsContainer.appendChild(optionInput);
    }

    async createPoll() {
        const messageEl = this.shadowRoot.getElementById('message');
        const title = this.shadowRoot.getElementById('pollTitle').value;
        const adminPassword = this.shadowRoot.getElementById('adminPassword').value;

        if (!title || !adminPassword) {
            messageEl.innerHTML = '<div class="error">Please provide title and admin password.</div>';
            return;
        }

        const questions = [];
        const questionBuilders = this.shadowRoot.querySelectorAll('.question-builder');

        for (let builder of questionBuilders) {
            const questionText = builder.querySelector('.question-input').value;
            const questionType = builder.querySelector('.question-type').value;
            const options = Array.from(builder.querySelectorAll('.option-input'))
                .map(input => input.value)
                .filter(value => value.trim() !== '');

            if (!questionText || options.length < 2) {
                messageEl.innerHTML = '<div class="error">Each question must have text and at least 2 options.</div>';
                return;
            }

            questions.push({
                question: questionText,
                type: questionType,
                options: options
            });
        }

        messageEl.innerHTML = '<div class="loading">Creating poll...</div>';

        try {
            const response = await fetch('http://localhost:3000/poll/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, questions, adminPassword })
            });

            const data = await response.json();

            if (response.ok) {
                messageEl.innerHTML = `
                    <div class="success">
                        Poll created successfully!<br>
                        <strong>Poll Code: ${data.code}</strong><br>
                        Share this code with participants.
                    </div>
                `;
                
                // Show admin panel option
                setTimeout(() => {
                    messageEl.innerHTML += `
                        <button id="goToAdmin" style="margin-top: 10px;">Go to Admin Panel</button>
                    `;
                    this.shadowRoot.getElementById('goToAdmin').addEventListener('click', () => {
                        this.adminPassword = adminPassword;
                        this.showAdminPanel(data.code);
                    });
                }, 1000);
            } else {
                messageEl.innerHTML = `<div class="error">${data.message}</div>`;
            }
        } catch (error) {
            messageEl.innerHTML = '<div class="error">Connection error. Please try again.</div>';
        }
    }

    async showAdminPanel(pollCode) {
        if (!this.adminPassword) {
            const password = prompt('Enter admin password:');
            if (!password) return;
            this.adminPassword = password;
        }

        try {
            const response = await fetch(`http://localhost:3000/poll/${pollCode}/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: this.adminPassword })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAdminResults(data);
            } else {
                alert(data.message);
                this.adminPassword = null;
            }
        } catch (error) {
            alert('Connection error');
        }
    }

    showAdminResults(data) {
        const { poll, results } = data;
        
        let resultsHTML = results.map(result => {
            const total = result.totalResponses;
            const optionsHTML = Object.entries(result.results).map(([option, count]) => {
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                return `
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${percentage}%"></div>
                        <div class="result-text">${option}: ${count} votes (${percentage}%)</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="results-container">
                    <h3>${result.question}</h3>
                    <p><small>Type: ${result.type} choice | Total responses: ${total}</small></p>
                    ${optionsHTML}
                </div>
            `;
        }).join('');

        this.shadowRoot.innerHTML = `
            <main>
                <div class="container">
                    <h1>📊 Admin Panel</h1>
                    <div class="poll-info">
                        <strong>${poll.title}</strong><br>
                        Code: ${poll.code} | Status: ${poll.active ? '🟢 Active' : '🔴 Inactive'}<br>
                        Total Responses: ${poll.totalResponses}
                    </div>
                    
                    <div class="admin-controls">
                        <button id="togglePoll">${poll.active ? 'Deactivate' : 'Activate'} Poll</button>
                        <button id="refreshResults" class="secondary">Refresh Results</button>
                    </div>
                    
                    <h2>Results</h2>
                    ${resultsHTML}
                    
                    <button id="backToMenu" class="back-button">Back to Menu</button>
                </div>
            </main>
        `;

        this.shadowRoot.getElementById('togglePoll').addEventListener('click', () => this.togglePoll(poll.code));
        this.shadowRoot.getElementById('refreshResults').addEventListener('click', () => this.showAdminPanel(poll.code));
        this.shadowRoot.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
    }

    async togglePoll(pollCode) {
        try {
            const response = await fetch(`http://localhost:3000/poll/${pollCode}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: this.adminPassword })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                this.showAdminPanel(pollCode);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Connection error');
        }
    }

    connectedCallback() {
        console.log('Poll component connected');
    }

    disconnectedCallback() {
        console.log('Poll component removed from the page.');
    }
}

customElements.define('poll-component', Poll);