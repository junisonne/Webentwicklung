import * as api from "./api.js";
import * as templates from "./templates.js";
import { handleEnterAsAdmin, handleSearchPolls } from "./utils/pollOverviewHandler.js";
import { loadPollTemplate, addQuestion, addOption, resetQuestion, handleAnsweredQuestions } from "./utils/pollCreateHandler.js";
import { handleBanNewIP, setupIPEventListeners } from "./utils/ipHandler.js";
import { handleRefreshResults, updateResultBars, generateQRCode, updatePollStatus, handleDownloadResultsCSV } from "./utils/adminHandler.js";
import { applyStylesToShadowRoot } from "./utils/styleUtils.js";

class Poll extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    
    this.state = { currentPoll: null, userResponses: [], adminPassword: null };

    this.apiUrl = this.getAttribute("api-url") || "http://localhost:3000";
    api.setApiUrl(this.apiUrl);

    const initial = this.getAttribute("initial-poll") || null;
    try {
      this.initialPoll = initial ? JSON.parse(initial) : null;
    } catch {
      console.error("Invalid JSON in initial-poll attribute");
      this.initialPoll = null;
    }
  }

  async connectedCallback() {
    const params = new URLSearchParams(window.location.search);
    const pollCode = params.get("code");

    if (pollCode) {
      this.autoJoinPoll(pollCode);
    } else {
      this.showMainMenu();
    }
  }

  /**
   * Central rendering method for all component views
   * Handles template injection and event handler binding with proper context
   * 
   * @param {string} template - HTML template string to render
   * @param {Array<Object>} eventHandlers - Array of event handler configurations
   * @param {string} eventHandlers[].selector - Element ID to attach event to
   * @param {string} eventHandlers[].event - Event type (click, submit, etc.)
   * @param {Function} eventHandlers[].handler - Event handler function
   */
  render(template, eventHandlers = []) {
    this.shadowRoot.innerHTML = template;
    eventHandlers.forEach(({ selector, event, handler }) => {
      const element = this.shadowRoot.getElementById(selector);
      if (element) {
        element.addEventListener(event, handler.bind(this));
      }
    });
  }
  /**
   * Displays the main navigation menu with poll options
   * Applies view-specific styles and sets up navigation event handlers
   */
  async showMainMenu() {
    await applyStylesToShadowRoot(this.shadowRoot, 'mainMenu');
    this.render(templates.getMainMenuTemplate(), [
      { selector: "joinPoll", event: "click", handler: this.showJoinPoll },
      { selector: "createPoll", event: "click", handler: this.showCreatePoll },
      { selector: "viewPolls", event: "click", handler: this.showAllPolls },
    ]);
  }
  /**
   * Displays the poll joining interface
   * Provides input field for poll code entry and navigation
   */
  async showJoinPoll() {
    await applyStylesToShadowRoot(this.shadowRoot, 'joinPoll');
    this.render(templates.getJoinPollTemplate(), [
      { selector: "enterPoll", event: "click", handler: this.joinPoll },
      { selector: "backToMenu", event: "click", handler: this.showMainMenu },
    ]);
  }
  /**
   * Handles poll joining process with validation and error handling
   * Validates poll code, fetches poll data, and transitions to questions view
   * Provides specific error handling for banned IPs and general errors
   */
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

  /**
   * Displays all available polls with admin access functionality
   * Fetches poll list and sets up admin authentication and search handlers
   */
  async showAllPolls() {
    const polls = await api.getAllPolls();
    await applyStylesToShadowRoot(this.shadowRoot, 'pollList');
    this.render(templates.getPollListTemplate(polls.polls), [
      { selector: "backToMenu", event: "click", handler: this.showMainMenu },
    ]);
    handleEnterAsAdmin(this.shadowRoot, polls.polls, this.state, this.showAdminPanel.bind(this));
    handleSearchPolls(this.shadowRoot, polls.polls, this.state, this.showAdminPanel.bind(this));
  }

  /**
   * Displays poll questions interface for user participation
   * Renders questions with interactive options and sets up selection handlers
   */
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

  /**
   * Handles option selection for both single and multiple choice questions
   * Manages UI state changes and updates user response data
   * Uses CSS classes for visual feedback instead of direct style manipulation
   * 
   * @param {Event} event - Click event from option button
   */
  selectOption(event) {
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

  /**
   * Validates and submits user responses to the poll
   * Ensures data integrity by validating all fields before submission
   * Provides user feedback and handles submission errors gracefully
   */
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

  /**
   * Displays the poll creation interface with dynamic question building
   * Sets up form handlers for adding questions, options, and template loading
   * Implements progressive enhancement for initial poll templates
   */
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
        btn.addEventListener('click', () => loadPollTemplate(this.shadowRoot, this.initialPoll));
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


  /**
   * Processes poll creation with comprehensive validation
   * Validates form data, creates poll via API, and provides admin panel access
   * Handles creation errors and provides user feedback throughout the process
   */
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
  

  /**
   * Initiates admin panel access with authentication
   * Prompts for admin password if not cached and validates access
   * Implements progressive enhancement for admin functionality
   * @param {string} pollCode - Unique identifier for the poll
   */
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

  /**
   * Renders the complete admin panel with poll management capabilities
   * Implements progressive enhancement: basic management, IP banning, QR codes
   * Sets up all admin event handlers and initializes enhanced features
   * @param {Object} data - Complete poll data including results and participants
   */
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
        handler: () => handleDownloadResultsCSV(this.shadowRoot, data),
      },
    ]);

    updateResultBars(this.shadowRoot);
    setupIPEventListeners(this.shadowRoot, data, this.state.adminPassword);
    generateQRCode(this.shadowRoot, data.poll.code);
  }

  /**
   * Toggles poll active state with optimized DOM updates
   * Updates only the poll status section instead of reloading entire admin panel
   * Provides error handling with appropriate user feedback
   * 
   * @async
   * @param {string} pollCode - Unique identifier for the poll
   * @memberof Poll
   * @returns {Promise<void>}
   */
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

  /**
   * Automatically joins a poll when accessed via direct URL with poll code
   * Handles automatic poll entry from URL parameters for seamless user experience
   * Falls back to main menu on any errors during auto-join process
   * 
   * @async
   * @param {string} pollCode - Poll code from URL parameter
   * @memberof Poll
   * @returns {Promise<void>}
   */
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