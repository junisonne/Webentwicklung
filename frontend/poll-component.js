import * as api from './api.js';
import * as templates from './templates.js';

const pollStyles = new CSSStyleSheet();
fetch('./frontend/styles.css')
    .then(response => response.text())
    .then(text => pollStyles.replaceSync(text));

class Poll extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [pollStyles];
        this.state = { currentPoll: null, userResponses: [], adminPassword: null };
    }

    connectedCallback() {
        // 1. Query-Parameter auslesen
        const params   = new URLSearchParams(window.location.search);
        const pollCode = params.get('code');

        if (pollCode) {
        // 2. Wenn ein code da ist, direkt auto-join
        this.autoJoinPoll(pollCode);
        } else {
        // 3. Ansonsten das Main-Menu zeigen
        this.showMainMenu();
        }
    }

    render(template, eventHandlers = []) {
        this.shadowRoot.innerHTML = template;
        eventHandlers.forEach(({ selector, event, handler }) => {
            const element = this.shadowRoot.getElementById(selector);
            if (element) {
                element.addEventListener(event, handler.bind(this));
            }
        });
    }

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
        this.shadowRoot.querySelectorAll('#adminButton').forEach(button => {
            button.addEventListener('click', (e) => {
                const pollCode = e.target.dataset.code;
                const pollItem = e.target.closest('#pollItem');
                const adminInput = pollItem.querySelector('#adminInput').value;
                
                if (!adminInput) {
                    const messageEl = this.shadowRoot.getElementById('message');
                    if (messageEl) {
                        messageEl.innerHTML = '<div class="error">Please enter admin password</div>';
                    }
                    return;
                }
                else {
                    const poll = polls.polls.find(p => p.code === pollCode);
                    if(poll.adminPassword === adminInput) {
                        this.state.adminPassword = adminInput;
                        this.showAdminPanel(pollCode);
                    } else {
                        console.error('Invalid admin password for poll:', pollCode);
                        const messageEl = this.shadowRoot.getElementById('message');
                        if (messageEl) {
                            messageEl.innerHTML = '<div class="error">Invalid admin password</div>';
                        }
                    }
                }
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
        
        // Add event listeners for the first question
        this.shadowRoot.querySelector('.add-option').addEventListener('click', (e) => this.addOption(e));
        this.shadowRoot.querySelector('.reset-question').addEventListener('click', (e) => this.resetQuestion(e));
    }

    addQuestion() {
        const container = this.shadowRoot.getElementById('questionsContainer');
        const questionCount = container.children.length + 1;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-builder';
        questionDiv.dataset.questionNumber = questionCount;
        questionDiv.innerHTML = `
            <div class="question-header">
                <input type="text" placeholder="Question ${questionCount}" class="question-input" />
                <select class="question-type">
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                </select>
                <button type="button" class="delete-question">Delete</button>
            </div>
            <div class="options-container">
                <input type="text" placeholder="Option 1" class="option-input" />
                <input type="text" placeholder="Option 2" class="option-input" />
            </div>
            <button type="button" class="add-option secondary">+ Add Option</button>
        `;
        container.appendChild(questionDiv);
        questionDiv.querySelector('.add-option').addEventListener('click', (e) => this.addOption(e));
        questionDiv.querySelector('.delete-question').addEventListener('click', () => {
            container.removeChild(questionDiv);
        });
    }

    addOption(event) {
        const optionsContainer = event.target.previousElementSibling;
        const optionCount = optionsContainer.children.length + 1;
        const optionRow = document.createElement('div');
        optionRow.className = 'option-row';

        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.className = 'option-input';
        optionInput.placeholder = `Option ${optionCount}`;

        const optionRemoveButton = document.createElement('button');
        optionRemoveButton.textContent = 'Remove';
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
            
            // Mark all empty option inputs as errors
            optionInputs.forEach(input => {
                if (!input.value.trim()) {
                    hasEmptyFields = true;
                    input.classList.add('input-error');
                } else {
                    input.classList.remove('input-error');
                }
            });

            if (questionText && options.length >= 2) {
                questions.push({ question: questionText, type: questionType, options });
            }
        });

        if (hasEmptyFields) {
            messageEl.innerHTML = '<div class="error">Please fill in all questions and provide at least two options for each question.</div>';
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
            { selector: 'banIPButton', event: 'click', handler: () => this.banNewIP(data.poll.code) }
        ]);

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

        const qrTarget = `${location.origin}/index.html?code=${data.poll.code}`;
        const canvas   = this.shadowRoot.getElementById('qrcode');

        if (canvas && window.QRCode) {
            QRCode.toCanvas(canvas, qrTarget, { width: 200 }, (error) => {
        if (error) console.error('QR-Code Fehler:', error);
            });
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

customElements.define('poll-component', Poll);
