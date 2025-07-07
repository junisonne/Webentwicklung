// Templates.js - Contains HTML templates for the poll application UI components
// Each function returns a template string that can be injected into the DOM

/**
 * Generates the main menu interface with options to create, join, or view polls
 */
export const getMainMenuTemplate = () => `
    <main>
        <div class="container">
            <header>
                <h1>📊 Poll System</h1>
            </header>
            <section class="menu-section">
                <nav class="menu-navigation">
                    <div class="button-container">
                        <button id="createPoll" class="secondary">Create Poll as Admin</button>
                        <button id="joinPoll">Join Poll</button>
                        <button id="viewPolls" class="secondary">View Polls</button>
                    </div>
                </nav>
            </section>
        </div>
    </main>
`;

/**
 * Generates the join poll interface where users can enter a poll code
 */
export const getJoinPollTemplate = () => `
    <main>
        <div class="container">
            <header>
                <h1>Join Poll</h1>
            </header>
            <section class="poll-form">
                <form class="join-poll-form" onsubmit="return false;">
                    <div class="input-group">
                        <input type="text" id="pollCode" placeholder="Enter Poll Code" aria-label="Poll Code" />
                    </div>
                    <div class="action-buttons">
                        <button id="backToMenu" class="back-button">Back</button>
                        <button id="enterPoll" type="submit">Join Poll</button>
                    </div>
                </form>
                <div id="message" class="message-container" aria-live="polite"></div>
            </section>
        </div>
    </main>
`;

/**
 * Generates the poll questions interface for participants to answer questions
 * @param {Object} poll - The poll object containing title and questions
 */
export const getPollQuestionsTemplate = (poll) => `
    <main>
        <div class="container">
            <header>
                <h1>${poll.title}</h1>
            </header>
            <section class="poll-questions">
                <form class="questions-form" onsubmit="return false;">
                    <fieldset>
                        <legend class="sr-only">Poll Questions</legend>
                        ${poll.questions
                          .map((q, i) => getQuestionTemplate(q, i))
                          .join("")}
                    </fieldset>
                    <div class="action-buttons">
                        <button id="backToMenu" class="back-button" type="button">Back to Menu</button>
                        <button id="submitResponses" type="submit">Submit Responses</button>
                    </div>
                </form>
                <div id="message" class="message-container" aria-live="polite"></div>
            </section>
        </div>
    </main>
`;

/**
 * Helper function that generates the HTML for an individual question
 * Renders question text with numbering and creates interactive option buttons
 * that display differently based on question type (single/multiple choice)
 * @param {Object} question - Question object with type, text and options
 * @param {Number} index - Question index for numbering and data attributes
 */
const getQuestionTemplate = (question, index) => `
    <article class="question-container ${
      question.type === "single" ? "single-choice" : "multiple-choice"
    }">
        <header class="question-title">
            <h2>${index + 1}. ${question.question}</h2>
            <p><small>(Select ${
              question.type === "single" ? "one option" : "one or more options"
            })</small></p>
        </header>
        <div class="options-group" role="group" aria-labelledby="question-${index}">
            ${question.options
              .map(
                (opt) => `
                <button class="option-button" 
                        type="button" 
                        data-question="${index}" 
                        data-option="${opt}" 
                        role="${
                          question.type === "single" ? "radio" : "checkbox"
                        }" 
                        aria-checked="false">
                    <span class="option-indicator" data-selected="${
                      question.type === "single" ? "◉" : "☑"
                    }" data-unselected="${
                  question.type === "single" ? "○" : "□"
                }" aria-hidden="true"></span>
                    <span class="option-text">${opt}</span>
                </button>
            `
              )
              .join("")}
        </div>
    </article>
`;

/**
 * Generates the poll creation interface for administrators
 * Includes form fields for poll title, password, and dynamic question creation
 */
export const getCreatePollTemplate = (hasInitial) => `
    <main>
        <div class="container">
            <header>
                <h1>Create New Poll</h1>
            </header>
            <section class="poll-creator">
                <form class="create-poll-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="pollTitle">Poll Title</label>
                        <input type="text" id="pollTitle" placeholder="Enter poll title" aria-required="true" />
                    </div>
                    <div class="form-group">
                        <label for="adminPassword">Admin Password</label>
                        <input type="password" id="adminPassword" placeholder="Create admin password" aria-required="true" />
                    </div>
                    
                    <fieldset class="questions-fieldset">
                        <legend>Questions</legend>
                        <div id="questionsContainer">
                            <article class="question-builder" data-question-number="1">
                                <header class="question-header">
                                    <input type="text" placeholder="Question 1" class="question-input" aria-label="Question 1" />
                                    <select class="question-type" aria-label="Question type">
                                        <option value="single">Single Choice</option>
                                        <option value="multiple">Multiple Choice</option>
                                    </select>
                                    <button type="button" class="reset-question" aria-label="Reset question">Reset</button>
                                </header>
                                <div class="options-container">
                                    <input type="text" placeholder="Option 1" class="option-input" aria-label="Option 1" />
                                    <input type="text" placeholder="Option 2" class="option-input" aria-label="Option 2" />
                                </div>
                                <footer class="question-footer">
                                    <button type="button" class="add-option secondary" aria-label="Add option">+ Add Option</button>
                                </footer>
                            </article>
                        </div>
                        <button type="button" id="addQuestion" class="secondary" aria-label="Add another question">+ Add Question</button>
                    </fieldset>
                    
                    <div class="action-buttons">
                    ${
                      hasInitial
                        ? '<button type="button" id="loadTemplate">Load Template</button>'
                        : ""
                    }
                        <button type="button" id="backToMenu" class="back-button">Back</button>
                        <button type="submit" id="createPollBtn">Create Poll</button>
                    </div>
                </form>
                <div id="message" class="message-container" aria-live="polite"></div>
            </section>
        </div>
    </main>
`;

/**
 * Generates the admin panel interface with poll management capabilities
 * @param {Object} params - Object containing poll data, results, and participant information
 */
export const getAdminPanelTemplate = ({
  poll,
  results,
  participantEntries,
}) => `
    <main>
        <div class="container">
            <header>
                <h1>📊 Admin Panel</h1>
            </header>
            
            <div class="admin-dashboard">
                <article class="poll-info">
                    <header>
                        <h2>${poll.title}</h2>
                    </header>
                    <div class="poll-metadata">
                        <p>Code: <span class="highlight">${
                          poll.code
                        }</span> | Status: ${
  poll.active ? "🟢 Active" : "🔴 Inactive"
}</p>
                        <p>Total Responses: <span class="highlight">${
                          poll.totalResponses
                        }</span></p>
                    </div>
                </article>
                
                <aside id="qrcodeContainer" class="qrcode-section">
                    <h3>Beitreten per QR-Code:</h3>
                    <canvas id="qrcode" aria-label="QR code to join poll"></canvas>
                </aside>
                
                <nav class="admin-controls">
                    <button id="togglePoll" type="button">${
                      poll.active ? "Deactivate" : "Activate"
                    } Poll</button>
                    <button id="refreshResults" class="secondary" type="button">Refresh Results</button>
                    <button id="downloadCSV" class="secondary" type="button">Download Results (CSV)</button>
                </nav>
            </div>
            
            <section class="results-section">
                <header>
                    <h2>Results</h2>
                </header>
                <div class="results-container-wrapper">
                    ${results.map(getResultTemplate).join("")}
                </div>
            </section>
            
            <section class="ip-management">
                <header>
                    <h2>IP Addresses</h2>
                </header>
                <ul class="ip-list" role="list">
                    ${
                      participantEntries.length > 0
                        ? participantEntries
                            .map(
                              (ip) => `
                        <li class="ip-entry">
                            <span class="ip-details">${ip.ip} <small>${new Date(
                                ip.timestamp
                              ).toLocaleString()}</small></span>
                            <button class="ban-ip-btn" data-ip="${
                              ip.ip
                            }" type="button">Ban</button>
                        </li>
                    `
                            )
                            .join("")
                        : "<li><p>No IP addresses recorded.</p></li>"
                    }
                </ul>
                <div id="banMessage" class="message-container" aria-live="polite"></div>
            </section>

            <section class="ban-ip-section">
                <header>
                    <h2>Ban IP Address</h2>
                </header>
                <form class="ban-ip-form" onsubmit="return false;">
                    <div class="input-group">
                        <input type="text" id="ipToBan" placeholder="Enter IP address to ban (e.g. 192.168.1.100)" aria-label="IP address to ban" />
                        <button id="banIPButton" class="ban-confirm-btn" type="button">Ban IP</button>
                    </div>
                    <div id="banIPMessage" class="message-container" aria-live="polite"></div>
                </form>
            </section>
            
            <section class="banned-ip-section">
                <header>
                    <h2>Banned IP Addresses</h2>
                </header>
                <ul id="bannedIPsList" class="banned-ip-list" role="list">
                    ${
                      poll.bannedIPs.length > 0
                        ? poll.bannedIPs
                            .map(
                              (ip) => `
                        <li class="banned-ip-entry">
                            <span class="banned-ip">${ip}</span>
                            <button class="unban-btn" data-ip="${ip}" type="button">Unban</button>
                        </li>
                    `
                            )
                            .join("")
                        : "<li><p>No IP addresses are currently banned.</p></li>"
                    }
                </ul>
            </section>
            
            <footer class="admin-footer">
                <button id="backToMenu" class="back-button" type="button">Back to Menu</button>
            </footer>
        </div>
    </main>
`;

/**
 * Helper function that generates the HTML for displaying individual question results
 * @param {Object} result - Result data for a single question with options and vote counts
 */
const getResultTemplate = (result) => {
  // Calculate total responses for percentage calculations
  const total = result.totalResponses;
  return `
        <article class="results-container">
            <header>
                <h3>${result.question}</h3>
                <p><small>Type: ${
                  result.type
                } choice | Total responses: ${total}</small></p>
            </header>
            <section class="result-bars">
                ${Object.entries(result.results)
                  .map(([option, count]) => {
                    // Calculate percentage with 1 decimal place, handling zero total case
                    const percentage =
                      total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return `
                        <div class="result-bar" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" data-percentage="${percentage}">
                            <div class="result-fill"></div>
                            <div class="result-text">${option}: ${count} votes (${percentage}%)</div>
                        </div>
                    `;
                  })
                  .join("")}
            </section>
        </article>
    `;
};

/**
 * Generates the polls list interface showing available polls and admin access forms
 * @param {Array} polls - Array of poll objects to display
 */
export const getPollListTemplate = (polls) => `
    <main>
        <div class="container">
            <header>
                <h1>Available Polls</h1>
            </header>
            <section class="polls-section">
                <form class="poll-search-form">
                    <div class="input-group">
                        <input type="text" id="pollSearchInput" placeholder="Search polls by title or code" aria-label="Search polls" />
                        <button type="submit" id="pollSearchButton">🔎</button>
                        <button type="reset" id="pollSearchReset" class="secondary" value="Reset">Reset</button>
                    </div>
                </form>
                <nav>
                    <ul class="poll-list" role="list">
                        ${
                          polls.length > 0
                            ? polls
                                .map(
                                  (poll) => `
                            <li class="poll-item" data-code="${poll.code}">
                                <article class="poll-entry">
                                    <header class="poll-header">
                                        <h3 class="poll-title">${poll.title} <span class="poll-code">Code: ${poll.code}</span></h3>
                                    </header>
                                    <div class="poll-admin-access">
                                        <form class="admin-access-form" onsubmit="return false;">
                                            <label for="admin-${poll.code}" class="sr-only">Admin Password for ${poll.title}</label>
                                            <input id="admin-${poll.code}" type="password" class="admin-code-input" placeholder="Admin Code" data-code="${poll.adminPassword}" aria-required="true" />
                                            <button type="submit" class="join-poll-btn" data-code="${poll.code}">Enter as Admin</button>
                                        </form>
                                        <div class="message-container" aria-live="polite"></div>
                                    </div>
                                </article>
                            </li>
                        `
                                )
                                .join("")
                            : '<li class="no-polls-message"><p>No polls available</p></li>'
                        }
                    </ul>
                </nav>
                <footer class="polls-footer">
                    <button id="backToMenu" class="back-button">Back to Menu</button>
                </footer>
            </section>
        </div>
    </main>
`;
