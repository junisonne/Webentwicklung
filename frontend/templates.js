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
                        ${poll.questions.map((q, i) => getQuestionTemplate(q, i)).join('')}
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

const getQuestionTemplate = (question, index) => `
    <article class="question-container ${question.type === 'single' ? 'single-choice' : 'multiple-choice'}">
        <header class="question-title">
            <h2>${index + 1}. ${question.question}</h2>
            <p><small>(Select ${question.type === 'single' ? 'one option' : 'one or more options'})</small></p>
        </header>
        <div class="options-group" role="group" aria-labelledby="question-${index}">
            ${question.options.map(opt => `
                <button class="option-button" 
                        type="button" 
                        data-question="${index}" 
                        data-option="${opt}" 
                        role="${question.type === 'single' ? 'radio' : 'checkbox'}" 
                        aria-checked="false">
                    <span class="option-indicator" data-selected="${question.type === 'single' ? '◉' : '☑'}" data-unselected="${question.type === 'single' ? '○' : '□'}" aria-hidden="true"></span>
                    <span class="option-text">${opt}</span>
                </button>
            `).join('')}
        </div>
    </article>
`;

export const getCreatePollTemplate = () => `
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
                        <button type="button" id="backToMenu" class="back-button">Back</button>
                        <button type="submit" id="createPollBtn">Create Poll</button>
                    </div>
                </form>
                <div id="message" class="message-container" aria-live="polite"></div>
            </section>
        </div>
    </main>
`;

export const getAdminPanelTemplate = ({ poll, results, participantEntries}) => `
    <main>
        <section class="container">
            <h1>📊 Admin Panel</h1>
            <div class="poll-info">
                <strong>${poll.title}</strong><br>
                Code: ${poll.code} | Status: ${poll.active ? '🟢 Active' : '🔴 Inactive'}<br>
                Total Responses: ${poll.totalResponses}
            </div>
            <div id="qrcodeContainer" style="margin-top: 20px;">
            <h3>Beitreten per QR-Code:</h3>
            <canvas id="qrcode"></canvas>
            </div>
            <div class="admin-controls">
                <button id="togglePoll">${poll.active ? 'Deactivate' : 'Activate'} Poll</button>
                <button id="refreshResults" class="secondary">Refresh Results</button>
            </div>
            <h2>Results</h2>
            ${results.map(getResultTemplate).join('')}
            <h2>IP Addresses</h2>
            <div class="ip-list">
                ${participantEntries.length > 0 ? participantEntries.map(ip => `
                    <div class="ip-entry">
                        <span>${ip.ip} <small>${new Date(ip.timestamp).toLocaleString()}</small></span>
                        <button class="ban-ip-btn" data-ip="${ip.ip}">Ban</button>
                    </div>
                `).join('') : '<p>No IP addresses recorded.</p>'}
                <div id="banMessage"></div>
            </div>

            <h2>Ban IP Address</h2>
            <div class="ban-ip-section">
                <div class="ban-ip-input">
                    <input type="text" id="ipToBan" placeholder="Enter IP address to ban (e.g. 192.168.1.100)" />
                    <button id="banIPButton" class="ban-confirm-btn">Ban IP</button>
                </div>
                <div id="banIPMessage"></div>
            </div>
            
            <h2>Banned IP Addresses</h2>
            <div class="banned-ip-list">
                <div id="bannedIPsList">
                    ${poll.bannedIPs.length > 0 ? poll.bannedIPs.map(ip => `
                        <div class="banned-ip-entry">
                            <span class="banned-ip">${ip}</span>
                            <button class="unban-btn" data-ip="${ip}">Unban</button>
                        </div>
                    `).join('') : '<p>No IP addresses are currently banned.</p>'}
                </div>
            </div>
            
            <button id="backToMenu" class="back-button">Back to Menu</button>
        </section>
    </main>
`;

const getResultTemplate = (result) => {
    const total = result.totalResponses;
    return `
        <div class="results-container">
            <h3>${result.question}</h3>
            <p><small>Type: ${result.type} choice | Total responses: ${total}</small></p>
            ${Object.entries(result.results).map(([option, count]) => {
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                const questionTotal = result.results[option];
                return `
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${percentage}%"></div>
                        <div class="result-text">${option}: ${count} votes (${percentage}%)</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

export const getPollListTemplate = (polls) => `
    <main>
        <section class="container">
            <h1>Available Polls</h1>
            <ul class="poll-list">
                ${polls.length > 0 ? polls.map(poll => `
                    <li id="pollItem" class="poll-item" data-code="${poll.code}">
                        <span>${poll.title} (Code: ${poll.code})</span>
                        <input id="adminInput" type="password" class="admin-code-input" placeholder="Admin Code" data-code="${poll.adminPassword}" />
                        <div id="message"></div>
                        <button id="adminButton" class="join-poll-btn" data-code="${poll.code}">Enter as Admin</button>
                    </li>
                `).join('') : '<li>No polls available</li>'}
            </ul>
            <button id="backToMenu" class="back-button">Back to Menu</button>
        </section>
    </main>
`;
