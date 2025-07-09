import * as api from "./api.js";
import * as templates from "./templates.js";
import { generatePollResultsCSV, downloadCSV } from "./utils/csv-utils.js";
import { handleEnterAsAdmin, handleSearchPolls } from "./utils/pollOverviewHandler.js";
import { loadInitialPoll, addQuestion, addOption, resetQuestion, handleAnsweredQuestions } from "./utils/pollCreateHandler.js";
import { handleBanNewIP, setupIPEventListeners } from "./utils/ipHandler.js";
import { handleRefreshResults, updateResultBars, generateQRCode, updatePollStatus } from "./utils/adminHandler.js";
import { applyStylesToShadowRoot } from "./utils/style-utils.js";

// State is kept minimal with only essential data needed for poll operation
class Poll extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    
    // State initialisieren
    this.state = { currentPoll: null, userResponses: [], adminPassword: null };

    this.apiUrl = this.getAttribute("api-url") || "http://localhost:3000";
    api.setApiUrl(this.apiUrl);

    const initial = this.getAttribute("initial-poll") || null;
    try {
      this.initialPoll = initial ? JSON.parse(initial) : null;
    } catch {
      console.error("Ungültiges JSON in initial-poll");
      this.initialPoll = null;
    }
  }

  // Auto-join polls when URL contains code parameter, otherwise show menu
  async connectedCallback() {
    const params = new URLSearchParams(window.location.search);
    const pollCode = params.get("code");

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
  // 4. Apply view-specific styles

  async showMainMenu() {
    await applyStylesToShadowRoot(this.shadowRoot, 'mainMenu');
    this.render(templates.getMainMenuTemplate(), [
      { selector: "joinPoll", event: "click", handler: this.showJoinPoll },
      { selector: "createPoll", event: "click", handler: this.showCreatePoll },
      { selector: "viewPolls", event: "click", handler: this.showAllPolls },
    ]);
  }

  async showJoinPoll() {
    await applyStylesToShadowRoot(this.shadowRoot, 'joinPoll');
    this.render(templates.getJoinPollTemplate(), [
      { selector: "enterPoll", event: "click", handler: this.joinPoll },
      { selector: "backToMenu", event: "click", handler: this.showMainMenu },
    ]);
  }

  async joinPoll() {
    const pollCode = this.shadowRoot.getElementById("pollCode").value;
    const messageEl = this.shadowRoot.getElementById("message");

    if (!pollCode) {
      messageEl.innerHTML =
        '<div class="error">Please enter a poll code.</div>';
      return;
    }

    messageEl.innerHTML = '<div class="loading">Loading poll...</div>';

    try {
      const data = await api.joinPoll(pollCode);
      this.state.currentPoll = data.poll;
      this.state.userResponses = new Array(data.poll.questions.length).fill(
        null
      );
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
    await applyStylesToShadowRoot(this.shadowRoot, 'pollList');
    this.render(templates.getPollListTemplate(polls.polls), [
      { selector: "backToMenu", event: "click", handler: this.showMainMenu },
    ]);
    handleEnterAsAdmin(this.shadowRoot, polls.polls, this.state, this.showAdminPanel.bind(this));
    handleSearchPolls(this.shadowRoot, polls.polls, this.state, this.showAdminPanel.bind(this));
  }

  async showPollQuestions() {
    await applyStylesToShadowRoot(this.shadowRoot, 'pollQuestions');
    this.render(templates.getPollQuestionsTemplate(this.state.currentPoll), [
      {
        selector: "submitResponses",
        event: "click",
        handler: this.submitResponses,
      },
      { selector: "backToMenu", event: "click", handler: this.showMainMenu },
    ]);
    this.shadowRoot.querySelectorAll(".option-button").forEach((button) => {
      button.addEventListener("click", (e) => this.selectOption(e));
    });
  }

  // Handles both single and multiple choice questions in one component
  // Uses CSS classes for visual feedback rather than direct style manipulation
  selectOption(event) {
    // Get the button element, which could be the target or its parent
    const button = event.target.closest(".option-button");
    if (!button) return;

    const questionIndex = parseInt(button.dataset.question);
    const option = button.dataset.option;
    const question = this.state.currentPoll.questions[questionIndex];

    if (question.type === "single") {
      this.shadowRoot
        .querySelectorAll(`[data-question="${questionIndex}"]`)
        .forEach((btn) => {
          btn.classList.remove("selected");
        });
      button.classList.add("selected");
      this.state.userResponses[questionIndex] = option;
    } else {
      button.classList.toggle("selected");
      button.classList.toggle("multiple");

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
    const messageEl = this.shadowRoot.getElementById("message");
    const unanswered = this.state.userResponses.some((response, index) => {
      const question = this.state.currentPoll.questions[index];
      return question.type === "multiple"
        ? !response || response.length === 0
        : !response;
    });

    if (unanswered) {
      messageEl.innerHTML =
        '<div class="error">Please answer all questions.</div>';
      return;
    }

    messageEl.innerHTML = '<div class="loading">Submitting responses...</div>';

    try {
      await api.submitResponses(
        this.state.currentPoll.code,
        this.state.userResponses
      );
      messageEl.innerHTML =
        '<div class="success">Thank you! Your responses have been recorded.</div>';
      setTimeout(() => this.showMainMenu(), 2000);
    } catch (error) {
      messageEl.innerHTML = `<div class="error">${error.message}</div>`;
    }
  }

  async showCreatePoll() {
    await applyStylesToShadowRoot(this.shadowRoot, 'createPoll');
    this.render(
        templates.getCreatePollTemplate(this.initialPoll !== null),
    [
      { selector: "addQuestion", event: "click", handler: () => addQuestion(this.shadowRoot) },
      { selector: "createPollBtn", event: "click", handler: this.createPoll },
      { selector: "backToMenu", event: "click", handler: this.showMainMenu },
    ]);

    if (this.initialPoll) {
        const btn = this.shadowRoot.getElementById('loadTemplate');
        btn.addEventListener('click', () => loadInitialPoll(this.shadowRoot, this.initialPoll));
    }

    this.shadowRoot
      .querySelectorAll(".question-builder")
      .forEach((questionBuilder) => {
        const addOptionButton = questionBuilder.querySelector(".add-option");
        if (addOptionButton) {
          addOptionButton.addEventListener("click", (e) => addOption(e));
        }

        const resetButton = questionBuilder.querySelector(".reset-question");
        if (resetButton) {
          resetButton.addEventListener("click", (e) => resetQuestion(e, this.shadowRoot));
        }
      });
  }


  async createPoll() {
    const messageEl = this.shadowRoot.getElementById("message");
    const title = this.shadowRoot.getElementById("pollTitle").value.trim();
    const adminPassword = this.shadowRoot
      .getElementById("adminPassword")
      .value.trim();

    if (!title || !adminPassword) {
      messageEl.innerHTML =
        '<div class="error">Please provide title and admin password.</div>';
      return;
    }

    const questionBuilders = this.shadowRoot.querySelectorAll(".question-builder");

    const { questions, hasEmptyFields, hasDuplicateOptions } = handleAnsweredQuestions(questionBuilders);
    if (hasEmptyFields) {
      messageEl.innerHTML =
        '<div class="error">Please fill in all questions and provide at least two options for each question.</div>';
      return;
    }
    if (hasDuplicateOptions) {
      messageEl.innerHTML =
        '<div class="error">Please ensure all options within each question are unique.</div>';
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
      this.shadowRoot
        .getElementById("goToAdmin")
        .addEventListener("click", () => this.showAdminPanel(data.code));
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
      this.state.adminPassword = prompt("Enter admin password:");
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

  async showAdminResults(data) {
    await applyStylesToShadowRoot(this.shadowRoot, 'adminPanel');
    this.render(templates.getAdminPanelTemplate(data), [
      {
        selector: "togglePoll",
        event: "click",
        handler: () => this.togglePoll(data.poll.code),
      },
      {
        selector: "refreshResults",
        event: "click",
        handler: () => handleRefreshResults(this.shadowRoot, data.poll.code, this.state.adminPassword),
      },
      { selector: "backToMenu", 
        event: "click", 
        handler: this.showMainMenu 
    },
      {
        selector: "banIPButton",
        event: "click",
        handler: () => handleBanNewIP(this.shadowRoot, data.poll.code, this.state.adminPassword),
      },
      {
        selector: "downloadCSV",
        event: "click",
        handler: () => this.downloadResultsCSV(data),
      },
    ]);

    updateResultBars(this.shadowRoot);
    setupIPEventListeners(this.shadowRoot, data, this.state.adminPassword);
    generateQRCode(this.shadowRoot, data.poll.code);
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
    const messageEl =
      this.shadowRoot.getElementById("banIPMessage") ||
      this.shadowRoot.getElementById("banMessage");
    if (messageEl) {
      messageEl.innerHTML =
        '<div class="success">CSV downloaded successfully!</div>';
      setTimeout(() => {
        messageEl.innerHTML = "";
      }, 3000);
    }
  }

  async togglePoll(pollCode) {
    const messageEl = this.shadowRoot.getElementById("message");
    try {
      const data = await api.togglePollStatus(
        pollCode,
        this.state.adminPassword
      );
      updatePollStatus(this.shadowRoot, data.poll);
    } catch (error) {
        if(messageEl) messageEl.innerHTML = `<div class="error">${error.message}</div>`;
    }
  }

  async autoJoinPoll(pollCode) {
    try {
      const data = await api.joinPoll(pollCode);
      this.state.currentPoll = data.poll;
      this.state.userResponses = new Array(data.poll.questions.length).fill(
        null
      );
      this.showPollQuestions();
    } catch (error) {
      this.showMainMenu();
    }
  }
}

customElements.define("poll-component", Poll);