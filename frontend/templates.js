export const getMainMenuTemplate = () => `
    <main>
        <div class="container">
            <h1>📊 Poll System</h1>
            <button id="createPoll" class="secondary">Create Poll as Admin</button>
            <button id="joinPoll">Join Poll</button>
            <button id="viewPolls" class="secondary">View Polls</button>
        </div>
    </main>
`;

export const getJoinPollTemplate = () => `
    <main>
        <div class="container">
            <h1>Join Poll</h1>
            <input type="text" id="pollCode" placeholder="Enter Poll Code" />
            <br>
            <button id="backToMenu" class="back-button">Back</button>
            <button id="enterPoll">Join Poll</button>
            <div id="message"></div>
        </div>
    </main>
`;

export const getPollQuestionsTemplate = (poll) => `
    <main>
        <div class="container">
            <h1>${poll.title}</h1>
            ${poll.questions.map((q, i) => getQuestionTemplate(q, i)).join('')}
            <button id="backToMenu" class="back-button">Back to Menu</button>
            <button id="submitResponses">Submit Responses</button>
            <div id="message"></div>
        </div>
    </main>
`;

const getQuestionTemplate = (question, index) => `
    <div class="question-container">
        <div class="question-title">
            ${index + 1}. ${question.question}
            <small style="color: #666;">(${question.type === 'single' ? 'Single choice' : 'Multiple choice'})</small>
        </div>
        ${question.options.map(opt => `
            <button class="option-button" data-question="${index}" data-option="${opt}">
                ${opt}
            </button>
        `).join('')}
    </div>
`;

export const getCreatePollTemplate = () => `
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
            <button id="backToMenu" class="back-button">Back</button>
            <button id="createPollBtn">Create Poll</button>
            <div id="message"></div>
        </div>
    </main>
`;

export const getAdminPanelTemplate = ({ poll, results, participantEntries }) => `
    <main>
        <div class="container">
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
                        <button id="banIP" class="ban-ip-btn" data-ip="${ip.ip}">Ban</button>
                    </div>
                `).join('') : '<p>No IP addresses recorded.</p>'}
            </div>
            <button id="backToMenu" class="back-button">Back to Menu</button>
        </div>
    </main>
`;

const getResultTemplate = (result) => {
    const total = result.totalResponses;
    return `
        <div class="results-container">
            <h3>${result.question}</h3>
            <p><small>Type: ${result.type} choice | Total responses: ${total}</small></p>
            ${Object.entries(result.results).map(([option, count]) => {
                const percentage = total > 0 ? ((count / (result.type === 'multiple' ? total : result.questionTotal)) * 100).toFixed(1) : 0;
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
        <div class="container">
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
        </div>
    </main>
`;
