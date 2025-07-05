// test/templates.test.js
import {
  getMainMenuTemplate,
  getJoinPollTemplate,
  getPollQuestionsTemplate,
  getCreatePollTemplate,
  getAdminPanelTemplate,
  getPollListTemplate
} from '../frontend/templates';

describe('Main Menu Template', () => {
  it('renders title and navigation buttons', () => {
    const html = getMainMenuTemplate();
    // The main heading should be present
    expect(html).toContain('<h1>📊 Poll System</h1>');
    // Buttons for create, join and view polls
    expect(html).toContain('id="createPoll"');
    expect(html).toContain('id="joinPoll"');
    expect(html).toContain('id="viewPolls"');
    // The template should start with a <main> element
    expect(html.trim().startsWith('<main>')).toBe(true);
  });
});

describe('Join Poll Template', () => {
  it('includes form inputs and message container', () => {
    const html = getJoinPollTemplate();
    // Heading for join poll
    expect(html).toContain('<h1>Join Poll</h1>');
    // Input for poll code
    expect(html).toContain('id="pollCode"');
    // Buttons to go back or enter
    expect(html).toContain('id="backToMenu"');
    expect(html).toContain('id="enterPoll"');
    // Container for validation or info messages
    expect(html).toContain('id="message"');
  });
});

describe('Poll Questions Template', () => {
  const poll = {
    title: 'Favorite Framework',
    questions: [
      { question: 'React or Vue?', type: 'single', options: ['React', 'Vue'] },
      { question: 'TS Libraries?', type: 'multiple', options: ['Lodash', 'Axios', 'Moment'] }
    ]
  };

  it('renders each question with correct labels and options', () => {
    const html = getPollQuestionsTemplate(poll);
    // Title matches poll.title
    expect(html).toContain(`<h1>${poll.title}</h1>`);
    poll.questions.forEach((q, i) => {
      // Each question number and text should appear
      expect(html).toContain(`${i + 1}. ${q.question}`);
      // Instruction text depends on type
      const instruction = q.type === 'single'
        ? 'one option'
        : 'one or more options';
      expect(html).toContain(`Select ${instruction}`);
      // Each option button should have correct data attributes
      q.options.forEach(opt => {
        expect(html).toContain(`data-question="${i}"`);
        expect(html).toContain(`data-option="${opt}"`);
      });
    });
    // Back and submit buttons should be present
    expect(html).toContain('id="backToMenu"');
    expect(html).toContain('id="submitResponses"');
    expect(html).toContain('id="message"');
  });
});

describe('Create Poll Template', () => {
  it('provides inputs for title, password, questions and controls', () => {
    const html = getCreatePollTemplate();
    // Heading for new poll creation
    expect(html).toContain('<h1>Create New Poll</h1>');
    // Inputs for title and admin password
    expect(html).toContain('id="pollTitle"');
    expect(html).toContain('id="adminPassword"');
    // Container for dynamic questions
    expect(html).toContain('id="questionsContainer"');
    // Classes for question and option inputs
    expect(html).toContain('class="question-input"');
    expect(html).toContain('class="question-type"');
    expect(html).toContain('class="option-input"');
    // Buttons to add options/questions and to submit or go back
    expect(html).toContain('class="add-option secondary"');
    expect(html).toContain('id="addQuestion"');
    expect(html).toContain('id="createPollBtn"');
    expect(html).toContain('id="backToMenu"');
    expect(html).toContain('id="message"');
  });
});

describe('Admin Panel Template', () => {
  const pollData = {
    poll: {
      title: 'Admin Survey',
      code: 'ADM1',
      totalResponses: 5,
      createdAt: '2021-05-01T10:00:00Z',
      active: true,
      bannedIPs: ['1.2.3.4']
    },
    results: [
      {
        question: 'Q1',
        type: 'single',
        results: { Yes: 3, No: 2 },
        totalResponses: 5
      }
    ],
    participantEntries: [
      { ip: '5.6.7.8', timestamp: '2021-05-02T12:00:00Z' }
    ]
  };

  it('shows poll metadata and control buttons', () => {
    const html = getAdminPanelTemplate(pollData);
    // Verify poll title and code/status
    expect(html).toContain(`<h2>${pollData.poll.title}</h2>`);
    expect(html).toContain(`Code: <span class="highlight">${pollData.poll.code}</span>`);
    // Toggle button label should reflect active state
    expect(html).toContain('Deactivate Poll');
    // CSV download button must be present
    expect(html).toContain('id="downloadCSV"');
    // QR code canvas should be included
    expect(html).toContain('id="qrcode"');
  });

  it('lists participant entries and banned IPs', () => {
    const html = getAdminPanelTemplate(pollData);
    // Participant IP should appear
    expect(html).toContain('5.6.7.8');
    // Banned IP should appear in banned list
    expect(html).toContain('1.2.3.4');
  });

  it('renders fallback messages when lists are empty', () => {
    const emptyData = {
      ...pollData,
      participantEntries: [],
      poll: { ...pollData.poll, bannedIPs: [] }
    };
    const html = getAdminPanelTemplate(emptyData);
    // No participants message
    expect(html).toContain('<li><p>No IP addresses recorded.</p></li>');
    // No banned IPs message
    expect(html).toContain('No IP addresses are currently banned.');
  });
});

describe('Poll List Template', () => {
  it('renders search form and list of polls', () => {
    const polls = [
      { title: 'Survey A', code: 'A1', adminPassword: 'pw' },
      { title: 'Survey B', code: 'B2', adminPassword: 'pw2' }
    ];
    const html = getPollListTemplate(polls);
    // Search input and buttons
    expect(html).toContain('id="pollSearchInput"');
    expect(html).toContain('id="pollSearchButton"');
    expect(html).toContain('id="pollSearchReset"');
    // Each poll entry should include title and code
    polls.forEach(p => {
      expect(html).toContain(p.title);
      expect(html).toContain(`data-code="${p.code}"`);
      // Admin-entry form should be present
      expect(html).toContain(`id="admin-${p.code}"`);
      expect(html).toContain('class="join-poll-btn"');
    });
    // Back button is always present
    expect(html).toContain('id="backToMenu"');
  });

  it('shows fallback when no polls exist', () => {
    const html = getPollListTemplate([]);
    // Fallback message for empty list
    expect(html).toContain('class="no-polls-message"');
    expect(html).toContain('No polls available');
  });
});
