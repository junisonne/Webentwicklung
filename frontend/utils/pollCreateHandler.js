/**
 * Loads initial poll data into the creation form
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 * @param {Object} initialPoll - Initial poll data to load
 */
export function loadInitialPoll(shadowRoot, initialPoll) {
  const data = initialPoll;
  
  shadowRoot.getElementById('pollTitle').value = data.title;
  shadowRoot.getElementById('adminPassword').value = data.adminPassword;
  
  const container = shadowRoot.getElementById('questionsContainer');
  container.innerHTML = '';
  
  data.questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'question-builder';
    div.dataset.questionNumber = i + 1;
    div.innerHTML = `
      <header class="question-header">
        <input type="text" placeholder="Question ${i+1}" 
               class="question-input" aria-label="Question ${i+1}" 
               value="${q.question}" />
        <select class="question-type" aria-label="Question type">
          <option value="single" ${q.type==='single'? 'selected':''}>Single Choice</option>
          <option value="multiple" ${q.type==='multiple'? 'selected':''}>Multiple Choice</option>
        </select>
        <button type="button" class="reset-question">Reset</button>
      </header>
      <div class="options-container">
        ${q.options.map((opt, idx) => `
          <input type="text" placeholder="Option ${idx+1}" 
                 class="option-input" aria-label="Option ${idx+1}" 
                 value="${opt}" />
        `).join('')}
      </div>
      <footer class="question-footer">
        <button type="button" class="add-option secondary">+ Add Option</button>
      </footer>
    `;
    container.appendChild(div);

    div.querySelector('.add-option')
       .addEventListener('click', e => addOption(e));
    div.querySelector('.reset-question')
       .addEventListener('click', e => resetQuestion(e, shadowRoot));
  });
}

/**
 * Adds a new question to the poll creation form
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 */
export function addQuestion(shadowRoot) {
  const container = shadowRoot.getElementById("questionsContainer");
  const questionCount = container.children.length + 1;
  const questionDiv = document.createElement("div");
  questionDiv.className = "question-builder";
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
  questionDiv
    .querySelector(".add-option")
    .addEventListener("click", (e) => addOption(e));
  questionDiv
    .querySelector(".delete-question")
    .addEventListener("click", () => {
      container.removeChild(questionDiv);
    });
}

/**
 * Adds a new option to a question
 * @param {Event} event - The click event from the add option button
 */
export function addOption(event) {
    // Find the closest question-builder parent
    const questionBuilder = event.target.closest(".question-builder");
    if (!questionBuilder) return;

    // Find the options-container within this question-builder
    const optionsContainer = questionBuilder.querySelector(".options-container");
    if (!optionsContainer) return;

    const optionCount = optionsContainer.children.length + 1;
    const optionRow = document.createElement("div");
    optionRow.className = "option-row";
    optionRow.setAttribute("role", "group");
    optionRow.setAttribute("aria-label", `Option ${optionCount}`);

    const optionInput = document.createElement("input");
    optionInput.type = "text";
    optionInput.className = "option-input";
    optionInput.placeholder = `Option ${optionCount}`;
    optionInput.setAttribute("aria-label", `Option ${optionCount}`);

    const optionRemoveButton = document.createElement("button");
    optionRemoveButton.textContent = "Remove";
    optionRemoveButton.type = "button";
    optionRemoveButton.className = "remove-option";
    optionRemoveButton.setAttribute("aria-label", `Remove option ${optionCount}`);
    optionRemoveButton.addEventListener("click", () => {
        optionsContainer.removeChild(optionRow);
    });

    optionRow.appendChild(optionInput);
    optionRow.appendChild(optionRemoveButton);
    optionsContainer.appendChild(optionRow);
}

/**
 * Resets a question to its default state
 * @param {Event} event - The click event from the reset button
 * @param {HTMLElement} shadowRoot - The shadow root of the poll component
 */
export function resetQuestion(event, shadowRoot) {
  const questionBuilder = event.target.closest(".question-builder");

  if (!questionBuilder) {
    console.error("Question builder not found");
    return;
  }

  const questionInput = questionBuilder.querySelector(".question-input");
  const resetButton = questionBuilder.querySelector(".reset-question");
  const questionType = questionBuilder.querySelector(".question-type");
  const optionsContainer = questionBuilder.querySelector(".options-container");
  const questionNumber = questionBuilder.dataset.questionNumber || "1";

  // Reset question text and placeholder
  if (questionInput) {
    questionInput.value = "";
    questionInput.placeholder = `Question ${questionNumber}`;
    questionInput.classList.remove("input-error");
  }

  // Reset question type to single choice
  if (questionType) {
    questionType.value = "single";
  }
  
  // Change reset button to delete question
  if(resetButton) {
    resetButton.type = "button";
    resetButton.className = "delete-question";
    resetButton.setAttribute("aria-label", "Delete question");
    resetButton.textContent = "Delete";
    resetButton.removeEventListener("click", resetQuestion);
    resetButton.addEventListener("click", () => {
        const container = shadowRoot.getElementById("questionsContainer");
        container.removeChild(questionBuilder);
    });
  }

  // Reset options to just 2 default options
  if (optionsContainer) {
    optionsContainer.innerHTML = `
      <input type="text" placeholder="Option 1" class="option-input" />
      <input type="text" placeholder="Option 2" class="option-input" />
    `;
  }
  
}
export function handleAnsweredQuestions(questionBuilders) {
    const questions = [];
    let hasEmptyFields = false;
    let hasDuplicateOptions = false;
    
    questionBuilders.forEach((builder) => {
      const questionText = builder
        .querySelector(".question-input")
        .value.trim();
      const questionType = builder.querySelector(".question-type").value;
      const optionInputs = Array.from(
        builder.querySelectorAll(".option-input")
      );
      const options = optionInputs
        .map((input) => input.value.trim())
        .filter((value) => value);

      // Check for empty question text
      if (!questionText) {
        hasEmptyFields = true;
        builder.querySelector(".question-input").classList.add("input-error");
      } else {
        builder
          .querySelector(".question-input")
          .classList.remove("input-error");
      }

      // Check for empty options
      if (optionInputs.length < 2 || options.length < 2) {
        hasEmptyFields = true;
      }

      // Check for duplicate options within this question
      const uniqueOptions = new Set();
      const duplicateInputs = [];

      optionInputs.forEach((input) => {
        const value = input.value.trim();
        if (!value) {
          hasEmptyFields = true;
          input.classList.add("input-error");
        } else {
          input.classList.remove("input-error");

          // Check for duplicates
          if (uniqueOptions.has(value.toLowerCase())) {
            hasDuplicateOptions = true;
            input.classList.add("input-error");
            duplicateInputs.push(input);
          } else {
            uniqueOptions.add(value.toLowerCase());
          }
        }
      });

      // Add visual indicator for duplicate options
      duplicateInputs.forEach((input) => {
        input.classList.add("duplicate-error");
        input.title = "Duplicate option - please provide unique options";
      });

      if (questionText && options.length >= 2 && duplicateInputs.length === 0) {
        questions.push({ question: questionText, type: questionType, options });
      }
    });

    return { questions, hasEmptyFields, hasDuplicateOptions };
  }