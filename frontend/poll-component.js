import * as api from './api.js';
import * as templates from './templates.js';
import { generatePollResultsCSV, downloadCSV } from './csv-utils.js';

const pollStyles = new CSSStyleSheet();
fetch('./frontend/styles.css')
    .then(response => response.text())
    .then(text => pollStyles.replaceSync(text));


// State is kept minimal with only essential data needed for poll operation
class Poll extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [pollStyles];
        this.state = { currentPoll: null, userResponses: [], adminPassword: null };

        this.apiUrl = this.getAttribute('api-url') || 'http://localhost:3000';
        api.setApiUrl(this.apiUrl);
    }

    // Auto-join polls when URL contains code parameter, otherwise show menu
    connectedCallback() {
        const params = new URLSearchParams(window.location.search);
        const pollCode = params.get('code');

        if (pollCode) {
            this.autoJoinPoll(pollCode);
        } else {
            this.showMainMenu();
        }
    }

    // Central render method for all views - handles both template and event binding
    render(template, eventHandlers = []) {
        this.shadowRoot.innerHTML = template;
        eventHandlers.forEach(({ selector, event, handler }) => {
            const element = this.shadowRoot.getElementById(selector);
            if (element) {
                element.addEventListener(event, handler.bind(this));
            }
        });
    }

    // Display handlers below follow a consistent pattern:
    // 1. Render appropriate template
    // 2. Bind necessary event handlers
    // 3. Initialize any required state

    showMainMenu() {
        this.render(templates.getMainMenuTemplate(), [
            { selector: 'joinPoll', event: 'click', handler: this.showJoinPoll },
            { selector: 'createPoll', event: 'click', handler: this.showCreatePoll },
            { selector: 'viewPolls', event: 'click', handler: this.showAllPolls }
        ]);
    }

    showJoinPoll() {
        this.render(templates.getJoinPollTemplate(), [
            { selector: 'enterPoll', event: 'click', handler: this.joinPoll },
            { selector: 'backToMenu', event: 'click', handler: this.showMainMenu }
        ]);
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
            const data = await api.joinPoll(pollCode);
            this.state.currentPoll = data.poll;
            this.state.userResponses = new Array(data.poll.questions.length).fill(null);
            this.showPollQuestions();
        } catch (error) {
            if (error.status === 403) {
                messageEl.innerHTML = `
                    <div class="error banned-error">
                        <h4>🚫 Access Denied</h4>
                        <p>Your IP address has been banned from entering this poll.</p>
                    </div>
                `;
            } else {
                messageEl.innerHTML = `<div class="error">${error.message}</div>`;
            }
        }
    }

    async showAllPolls() {
        const polls = await api.getAllPolls();
        this.render(templates.getPollListTemplate(polls.polls), [
            { selector: 'backToMenu', event: 'click', handler: this.showMainMenu },
        ]);

        this.handleEnterAsAdmin(polls.polls);
        this.handleSearchPolls(polls.polls);
    }
    handleEnterAsAdmin(polls) {
        this.shadowRoot.querySelectorAll('.admin-access-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const pollItem = form.closest('.poll-item');
                const button = form.querySelector('.join-poll-btn');
                const pollCode = button.dataset.code;
                const adminInput = form.querySelector('.admin-code-input').value;
                
                if (!adminInput) {
                    const messageEl = pollItem.querySelector('.message-container');
                    if (messageEl) {
                        messageEl.innerHTML = '<div class="error">Please enter admin password</div>';
                    }
                    return;
                }
                else {
                    const poll = polls.find(p => p.code === pollCode);
                    if(poll.adminPassword === adminInput) {
                        this.state.adminPassword = adminInput;
                        this.showAdminPanel(pollCode);
                    } else {
                        console.error('Invalid admin password for poll:', pollCode);
                        const messageEl = pollItem.querySelector('.message-container');
                        if (messageEl) {
                            messageEl.innerHTML = '<div class="error">Invalid admin password</div>';
                        }
                    }
                }
            });
            form.addEventListener('reset', (e) => {
                e.preventDefault();
                const pollItem = form.closest('.poll-item');
                const messageEl = pollItem.querySelector('.message-container');
                if (messageEl) {
                    messageEl.innerHTML = '';
                }
            });
        });
    }

    handleSearchPolls(polls) {
        this.shadowRoot.querySelectorAll('.poll-search-form').forEach(button => {
            button.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchInput = this.shadowRoot.getElementById('pollSearchInput');
                const searchTerm = searchInput.value.trim().toLowerCase();

                const newPolls = polls.filter(poll => {
                    const titleMatch = poll.title.toLowerCase().includes(searchTerm);
                    const codeMatch = poll.code.toLowerCase().includes(searchTerm);
                    return titleMatch || codeMatch;
                })
                this.render(templates.getPollListTemplate(newPolls), [
                    { selector: 'backToMenu', event: 'click', handler: this.showMainMenu },
                ]);
                this.handleEnterAsAdmin(newPolls);
                this.handleSearchPolls(polls);
            });
            button.addEventListener('reset', (e) => {
                e.preventDefault();
                this.showAllPolls(); 
            });
        });
    }



    showPollQuestions() {
        this.render(templates.getPollQuestionsTemplate(this.state.currentPoll), [
            { selector: 'submitResponses', event: 'click', handler: this.submitResponses },
            { selector: 'backToMenu', event: 'click', handler: this.showMainMenu }
        ]);
        this.shadowRoot.querySelectorAll('.option-button').forEach(button => {
            button.addEventListener('click', (e) => this.selectOption(e));
        });
    }

    // Handles both single and multiple choice questions in one component
    // Uses CSS classes for visual feedback rather than direct style manipulation
    selectOption(event) {
        // Get the button element, which could be the target or its parent
        const button = event.target.closest('.option-button');
        if (!button) return;
        
        const questionIndex = parseInt(button.dataset.question);
        const option = button.dataset.option;
        const question = this.state.currentPoll.questions[questionIndex];

        if (question.type === 'single') {
            this.shadowRoot.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('selected');
            });
            button.classList.add('selected');
            this.state.userResponses[questionIndex] = option;
        } else {
            button.classList.toggle('selected');
            button.classList.toggle('multiple');
            
            if (!this.state.userResponses[questionIndex]) {
                this.state.userResponses[questionIndex] = [];
            }
            
            const selectedOptions = this.state.userResponses[questionIndex];
            const optionIndex = selectedOptions.indexOf(option);
            
            if (optionIndex > -1) {
                selectedOptions.splice(optionIndex, 1);
            } else {
                selectedOptions.push(option);
            }
        }
    }

    // Ensures data integrity by validating all fields before submission
    async submitResponses() {
        const messageEl = this.shadowRoot.getElementById('message');
        const unanswered = this.state.userResponses.some((response, index) => {
            const question = this.state.currentPoll.questions[index];
            return question.type === 'multiple' ? !response || response.length === 0 : !response;
        });

        if (unanswered) {
            messageEl.innerHTML = '<div class="error">Please answer all questions.</div>';
            return;
        }

        messageEl.innerHTML = '<div class="loading">Submitting responses...</div>';

        try {
            await api.submitResponses(this.state.currentPoll.code, this.state.userResponses);
            messageEl.innerHTML = '<div class="success">Thank you! Your responses have been recorded.</div>';
            setTimeout(() => this.showMainMenu(), 2000);
        } catch (error) {
            messageEl.innerHTML = `<div class="error">${error.message}</div>`;
        }
    }

    showCreatePoll() {
        this.render(templates.getCreatePollTemplate(), [
            { selector: 'addQuestion', event: 'click', handler: this.addQuestion },
            { selector: 'createPollBtn', event: 'click', handler: this.createPoll },
            { selector: 'backToMenu', event: 'click', handler: this.showMainMenu }
        ]);
        
        // Add event listeners for all existing questions (including the first one)
        this.shadowRoot.querySelectorAll('.question-builder').forEach(questionBuilder => {
            const addOptionButton = questionBuilder.querySelector('.add-option');
            if (addOptionButton) {
                addOptionButton.addEventListener('click', (e) => this.addOption(e));
            }
            
            const resetButton = questionBuilder.querySelector('.reset-question');
            if (resetButton) {
                resetButton.addEventListener('click', (e) => this.resetQuestion(e));
            }
        });
    }

    addQuestion() {
        const container = this.shadowRoot.getElementById('questionsContainer');
        const questionCount = container.children.length + 1;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-builder';
        questionDiv.dataset.questionNumber = questionCount;
        questionDiv.innerHTML = `
            <header class="question-header">
                <input type="text" placeholder="Question ${questionCount}" class="question-input" aria-label="Question ${questionCount}" />
                <select class="question-type" aria-label="Question type">
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                </select>
                <button type="button" class="delete-question" aria-label="Delete question">Delete</button>
            </header>
            <div class="options-container">
                <input type="text" placeholder="Option 1" class="option-input" aria-label="Option 1" />
                <input type="text" placeholder="Option 2" class="option-input" aria-label="Option 2" />
            </div>
            <footer class="question-footer">
                <button type="button" class="add-option secondary" aria-label="Add option">+ Add Option</button>
            </footer>
        `;
        container.appendChild(questionDiv);
        
        // Add event listeners for this new question
        questionDiv.querySelector('.add-option').addEventListener('click', (e) => this.addOption(e));
        questionDiv.querySelector('.delete-question').addEventListener('click', () => {
            container.removeChild(questionDiv);
        });
    }

    addOption(event) {
        // Find the closest question-builder parent
        const questionBuilder = event.target.closest('.question-builder');
        if (!questionBuilder) return;
        
        // Find the options-container within this question-builder
        const optionsContainer = questionBuilder.querySelector('.options-container');
        if (!optionsContainer) return;
        
        const optionCount = optionsContainer.children.length + 1;
        const optionRow = document.createElement('div');
        optionRow.className = 'option-row';
        optionRow.setAttribute('role', 'group');
        optionRow.setAttribute('aria-label', `Option ${optionCount}`);

        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.className = 'option-input';
        optionInput.placeholder = `Option ${optionCount}`;
        optionInput.setAttribute('aria-label', `Option ${optionCount}`);

        const optionRemoveButton = document.createElement('button');
        optionRemoveButton.textContent = 'Remove';
        optionRemoveButton.type = 'button';
        optionRemoveButton.className = 'remove-option';
        optionRemoveButton.setAttribute('aria-label', `Remove option ${optionCount}`);
        optionRemoveButton.addEventListener('click', () => {
            optionsContainer.removeChild(optionRow);
        });
        
        optionRow.appendChild(optionInput);
        optionRow.appendChild(optionRemoveButton);
        optionsContainer.appendChild(optionRow);
    }

    async createPoll() {
        const messageEl = this.shadowRoot.getElementById('message');
        const title = this.shadowRoot.getElementById('pollTitle').value.trim();
        const adminPassword = this.shadowRoot.getElementById('adminPassword').value.trim();

        if (!title || !adminPassword) {
            messageEl.innerHTML = '<div class="error">Please provide title and admin password.</div>';
            return;
        }

        const questions = [];
        let hasEmptyFields = false;
        let hasDuplicateOptions = false;
        const questionBuilders = this.shadowRoot.querySelectorAll('.question-builder');
        
        questionBuilders.forEach(builder => {
            const questionText = builder.querySelector('.question-input').value.trim();
            const questionType = builder.querySelector('.question-type').value;
            const optionInputs = Array.from(builder.querySelectorAll('.option-input'));
            const options = optionInputs.map(input => input.value.trim()).filter(value => value);

            // Check for empty question text
            if (!questionText) {
                hasEmptyFields = true;
                builder.querySelector('.question-input').classList.add('input-error');
            } else {
                builder.querySelector('.question-input').classList.remove('input-error');
            }

            // Check for empty options
            if (optionInputs.length < 2 || options.length < 2) {
                hasEmptyFields = true;
            }
            
            // Check for duplicate options within this question
            const uniqueOptions = new Set();
            const duplicateInputs = [];
            
            optionInputs.forEach(input => {
                const value = input.value.trim();
                if (!value) {
                    hasEmptyFields = true;
                    input.classList.add('input-error');
                } else {
                    input.classList.remove('input-error');
                    
                    // Check for duplicates
                    if (uniqueOptions.has(value.toLowerCase())) {
                        hasDuplicateOptions = true;
                        input.classList.add('input-error');
                        duplicateInputs.push(input);
                    } else {
                        uniqueOptions.add(value.toLowerCase());
                    }
                }
            });
            
            // Add visual indicator for duplicate options
            duplicateInputs.forEach(input => {
                input.classList.add('duplicate-error');
                input.title = 'Duplicate option - please provide unique options';
            });

            if (questionText && options.length >= 2 && duplicateInputs.length === 0) {
                questions.push({ question: questionText, type: questionType, options });
            }
        });

        if (hasEmptyFields) {
            messageEl.innerHTML = '<div class="error">Please fill in all questions and provide at least two options for each question.</div>';
            return;
        }
        
        if (hasDuplicateOptions) {
            messageEl.innerHTML = '<div class="error">Please ensure all options within each question are unique.</div>';
            return;
        }

        messageEl.innerHTML = '<div class="loading">Creating poll...</div>';

        try {
            const data = await api.createPoll({ title, questions, adminPassword });
            this.state.adminPassword = adminPassword;
            messageEl.innerHTML = `
                <div class="success">
                    Poll created! Code: <strong>${data.code}</strong>
                </div>
                <button id="goToAdmin" style="margin-top: 10px;">Go to Admin Panel</button>
            `;
            this.shadowRoot.getElementById('goToAdmin').addEventListener('click', () => this.showAdminPanel(data.code));
        } catch (error) {
            messageEl.innerHTML = `<div class="error">${error.message}</div>`;
        }
    }

    // Admin panel implements progressive enhancement:
    // 1. Basic poll management
    // 2. IP banning functionality
    // 3. QR code generation if library available
    async showAdminPanel(pollCode) {
        if (!this.state.adminPassword) {
            this.state.adminPassword = prompt('Enter admin password:');
            if (!this.state.adminPassword) return;
        }

        try {
            const data = await api.getAdminData(pollCode, this.state.adminPassword);
            this.showAdminResults(data);
        } catch (error) {
            alert(error.message);
            this.state.adminPassword = null;
        }
    }

    showAdminResults(data) {
        console.log('Admin Data:', data);
        this.render(templates.getAdminPanelTemplate(data), [
            { selector: 'togglePoll', event: 'click', handler: () => this.togglePoll(data.poll.code) },
            { selector: 'refreshResults', event: 'click', handler: () => this.showAdminPanel(data.poll.code) },
            { selector: 'backToMenu', event: 'click', handler: this.showMainMenu },
            { selector: 'banIPButton', event: 'click', handler: () => this.banNewIP(data.poll.code) },
            { selector: 'downloadCSV', event: 'click', handler: () => this.downloadResultsCSV(data) }
        ]);
        
        // Initialize the result bars based on their data-percentage attribute
        this.shadowRoot.querySelectorAll('.result-bar').forEach(bar => {
            const percentage = bar.getAttribute('data-percentage');
            if (percentage) {
                bar.querySelector('.result-fill').style.width = `${percentage}%`;
            }
        });

        this.shadowRoot.querySelectorAll('.ban-ip-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const ip = e.target.dataset.ip;
                if (confirm(`Are you sure you want to ban IP: ${ip}?`)) {
                    this.banIP(ip, data.poll.code);
                }
            });
        });

        this.shadowRoot.querySelectorAll('.unban-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const ip = e.target.dataset.ip;
                if (confirm(`Are you sure you want to unban IP: ${ip}?`)) {
                    this.unbanIP(ip, data.poll.code);
                }
            });
        });

        const url = new URL(window.location.href);
        url.appendParams('code', data.poll.code);
        const qrTarget = url.toString(); // fully dynamic V3
        //const qrTarget = `${location.origin}${location.pathname}?code=${data.poll.code}`; // dynamic V2
        //const qrTarget = `${location.origin}/index.html?code=${data.poll.code}`; //hardcoded V1
        const canvas   = this.shadowRoot.getElementById('qrcode');

        if (canvas && window.QRCode) {
            QRCode.toCanvas(canvas, qrTarget, { width: 200 }, (error) => {
        if (error) console.error('QR-Code Fehler:', error);
            });
        }

    }

    /**
     * Generates and downloads a CSV file containing poll results
     * Only accessible from the admin panel
     * @param {Object} data - Poll data including results and metadata
     */
    downloadResultsCSV(data) {
        const csvContent = generatePollResultsCSV(data);
        const fileName = `poll-${data.poll.code}-results.csv`;
        downloadCSV(csvContent, fileName);
        
        // Provide user feedback
        const messageEl = this.shadowRoot.getElementById('banIPMessage') || 
                         this.shadowRoot.getElementById('banMessage');
        if (messageEl) {
            messageEl.innerHTML = '<div class="success">CSV downloaded successfully!</div>';
            setTimeout(() => {
                messageEl.innerHTML = '';
            }, 3000);
        }
    }

    async togglePoll(pollCode) {
        try {
            const data = await api.togglePollStatus(pollCode, this.state.adminPassword);
            alert(data.message);
            this.showAdminPanel(pollCode);
        } catch (error) {
            alert(error.message);
        }
    }

    async banNewIP(pollCode) {
        const ipInput = this.shadowRoot.getElementById('ipToBan');
        const messageEl = this.shadowRoot.getElementById('banIPMessage');
        const ip = ipInput.value.trim();

        if (!ip) {
            messageEl.innerHTML = '<div class="error">Please enter an IP address</div>';
            return;
        }

        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(ip)) {
            messageEl.innerHTML = '<div class="error">Please enter a valid IP address</div>';
            return;
        }

        try {
            messageEl.innerHTML = '<div class="loading">Banning IP...</div>';
            const data = await api.banIP(ip, pollCode);
            messageEl.innerHTML = `<div class="success">${data.message}</div>`;
            ipInput.value = '';
            
            this.showAdminPanel(pollCode);
        } catch (error) {
            messageEl.innerHTML = `<div class="error">${error.message}</div>`;
        }
    }

    // IP management functions use a common pattern for consistency:
    // 1. Validate input
    // 2. Show loading state
    // 3. Make API call
    // 4. Update UI with result
    async banIP(ip, pollCode) {
        const messageEl = this.shadowRoot.getElementById('banMessage');
        console.log('Banning IP:', ip, 'for poll:', pollCode);
        try {
            messageEl.innerHTML = '<div class="loading">Banning IP...</div>';
            const data = await api.banIP(ip, pollCode);
            messageEl.innerHTML = `<div class="success">${data.message}</div>`;
            
            this.showAdminPanel(pollCode);
        } catch (error) {
            messageEl.innerHTML = `<div class="error">${error.message}</div>`;
        }
    }

    async unbanIP(ip, pollCode) {
        try {
            const data = await api.unbanIP(ip, pollCode);
            
            const messageEl = this.shadowRoot.getElementById('banIPMessage') || this.shadowRoot.getElementById('banMessage');
            if (messageEl) {
                messageEl.innerHTML = `<div class="success">${data.message}</div>`;
            }
            
            this.showAdminPanel(pollCode);
        } catch (error) {
            const messageEl = this.shadowRoot.getElementById('banIPMessage') || this.shadowRoot.getElementById('banMessage');
            if (messageEl) {
                messageEl.innerHTML = `<div class="error">${error.message}</div>`;
            }
        }
    }

    async autoJoinPoll(pollCode) {
        try {
            const data = await api.joinPoll(pollCode);
            this.state.currentPoll = data.poll;
            this.state.userResponses = new Array(data.poll.questions.length).fill(null);
            this.showPollQuestions();
        } catch (error) {
            this.showMainMenu();
        }
    }

    // Question builder maintains a consistent structure while allowing full customization
    resetQuestion(event) {
        console.log('Reset question called', event);
        const questionBuilder = event.target.closest('.question-builder');
        
        if (!questionBuilder) {
            console.error('Question builder not found');
            return;
        }
        
        const questionInput = questionBuilder.querySelector('.question-input');
        const questionType = questionBuilder.querySelector('.question-type');
        const optionsContainer = questionBuilder.querySelector('.options-container');
        const questionNumber = questionBuilder.dataset.questionNumber || '1';
        
        console.log('Found elements:', { questionInput, questionType, optionsContainer });
        
        // Reset question text and placeholder
        if (questionInput) {
            questionInput.value = '';
            questionInput.placeholder = `Question ${questionNumber}`;
            questionInput.classList.remove('input-error');
        }
        
        // Reset question type to single choice
        if (questionType) {
            questionType.value = 'single';
        }
        
        // Reset options to just 2 default options
        if (optionsContainer) {
            optionsContainer.innerHTML = `
                <input type="text" placeholder="Option 1" class="option-input" />
                <input type="text" placeholder="Option 2" class="option-input" />
            `;
        }
        
        console.log('Question reset completed');
    }
}

// Register custom element for use in HTML
customElements.define('poll-component', Poll);
