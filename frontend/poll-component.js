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
            { selector: 'createPoll', event: 'click', handler: this.showCreatePoll }
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
            messageEl.innerHTML = `<div class="error">${error.message}</div>`;
        }
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
        const questionIndex = parseInt(event.target.dataset.question);
        const option = event.target.dataset.option;
        const question = this.state.currentPoll.questions[questionIndex];

        if (question.type === 'single') {
            this.shadowRoot.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => btn.classList.remove('selected'));
            event.target.classList.add('selected');
            this.state.userResponses[questionIndex] = option;
        } else {
            event.target.classList.toggle('selected');
            event.target.classList.toggle('multiple');
            
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
        this.shadowRoot.querySelectorAll('.question-builder').forEach(builder => {
            const questionText = builder.querySelector('.question-input').value;
            const questionType = builder.querySelector('.question-type').value;
            const options = Array.from(builder.querySelectorAll('.option-input'))
                .map(input => input.value.trim())
                .filter(value => value);

            if (questionText && options.length >= 2) {
                questions.push({ question: questionText, type: questionType, options });
            }
        });

        if (questions.length === 0) {
            messageEl.innerHTML = '<div class="error">Please add at least one question with two options.</div>';
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
        this.render(templates.getAdminPanelTemplate(data), [
            { selector: 'togglePoll', event: 'click', handler: () => this.togglePoll(data.poll.code) },
            { selector: 'refreshResults', event: 'click', handler: () => this.showAdminPanel(data.poll.code) },
            { selector: 'backToMenu', event: 'click', handler: this.showMainMenu }
        ]);
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

    async autoJoinPoll(pollCode) {
    try {
        const data = await api.joinPoll(pollCode);
        this.state.currentPoll = data.poll;
        this.state.userResponses = new Array(data.poll.questions.length).fill(null);
        this.showPollQuestions();
    } catch (error) {
        this.showMainMenu();
        alert(`Poll "${pollCode}" konnte nicht geladen werden: ${error.message}`);
    }
}
}

customElements.define('poll-component', Poll);
