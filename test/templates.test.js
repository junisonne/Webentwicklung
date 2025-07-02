import {
  getMainMenuTemplate,
  getJoinPollTemplate,
  getPollQuestionsTemplate,
  getCreatePollTemplate,
  getAdminPanelTemplate,
  getPollListTemplate
} from "../frontend/templates.js";

describe("Test MainMenuTemplate", () => {
  it("should return the main menu template", () => {
    const template = getMainMenuTemplate();
    expect(template).toContain('<h1>📊 Poll System</h1>');
    expect(template).toContain('id="createPoll"');
    expect(template).toContain('id="joinPoll"');
    expect(template).toContain('id="viewPolls"');
    expect(template.trim().startsWith("<main>")).toBe(true);
  });
});

describe("Test JoinPollTemplate", () => {
  it("should return the join poll template", () => {
    const template = getJoinPollTemplate();
    expect(template).toContain("<h1>Join Poll</h1>");
    expect(template).toContain('id="pollCode"');
    expect(template).toContain('id="backToMenu"');
    expect(template).toContain('id="enterPoll"');
    expect(template).toContain('id="message"');
    expect(template.trim().startsWith("<main>")).toBe(true);
  });
});

describe("Test PollQuestionsTemplate", () => {
  const poll = {
    title: "Favorite Framework",
    questions: [
      { question: "React or Vue?", type: "single", options: ["React", "Vue"] },
      { question: "TS Libraries?",  type: "multiple", options: ["Lodash", "Axios", "Moment"] }
    ]
  };

  it("should render poll questions with correct structure", () => {
    const template = getPollQuestionsTemplate(poll);

    expect(template).toContain(`<h1>${poll.title}</h1>`);
    poll.questions.forEach((q, i) => {
      const prefix = `${i + 1}. ${q.question}`;
      expect(template).toContain(prefix);
      // Updated expectations to match the actual template text
      const choiceType = q.type === "single" ? "one option" : "one or more options";
      expect(template).toContain(`(Select ${choiceType})`);
      q.options.forEach(opt => {
        expect(template).toContain(`data-question="${i}"`);
        expect(template).toContain(`data-option="${opt}"`);
      });
    });
    expect(template).toContain('id="backToMenu"');
    expect(template).toContain('id="submitResponses"');
    expect(template).toContain('id="message"');
    expect(template.trim().startsWith("<main>")).toBe(true);
  });
});

describe("Test CreatePollTemplate", () => {
  it("should render create poll form with all inputs and buttons", () => {
    const template = getCreatePollTemplate();
    expect(template).toContain("<h1>Create New Poll</h1>");
    expect(template).toContain('id="pollTitle"');
    expect(template).toContain('id="adminPassword"');
    expect(template).toContain('id="questionsContainer"');
    expect(template).toContain('class="question-input"');
    expect(template).toContain('class="question-type"');
    expect(template).toContain('class="option-input"');

    expect(template).toContain('class="add-option secondary"');
    expect(template).toContain('id="addQuestion"');
    expect(template).toContain('id="backToMenu"');
    expect(template).toContain('id="createPollBtn"');
    expect(template).toContain('id="message"');
    expect(template.trim().startsWith("<main>")).toBe(true);
  });
});

describe("Test PollListTemplate", () => {
  it("should list available polls when array is non-empty", () => {
    const polls = [
      { title: "Survey A", code: "AAA", adminPassword: "pw1" },
      { title: "Survey B", code: "BBB", adminPassword: "pw2" }
    ];
    const template = getPollListTemplate(polls);

    expect(template).toContain("<h1>Available Polls</h1>");
    polls.forEach(p => {
      expect(template).toContain(`data-code="${p.code}"`);
      expect(template).toContain(p.title);
      expect(template).toContain('id="adminInput"');
      expect(template).toContain('id="adminButton"');
    });
    expect(template).toContain('id="backToMenu"');
    expect(template.trim().startsWith("<main>")).toBe(true);
  });

  it("should show fallback message when no polls are available", () => {
    const template = getPollListTemplate([]);
    expect(template).toContain("<li>No polls available</li>");
  });
});
