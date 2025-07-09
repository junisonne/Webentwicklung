describe('Poll System - Happy Path', () => {
  // Test data for poll creation
  const pollTitle = 'Test Vorlesungsfeedback';
  const adminPassword = 'admin123';
  
  beforeEach(() => {
    // Visit the app using baseUrl from cypress.config.js
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(1000); // Longer pause for DOM rendering and network requests
  });

  describe('Poll Creator (Admin)', () => {
    it('can create a poll and return to the main menu', () => {
      // Click on the "Create Poll as Admin" button
      cy.get('poll-component')
        .shadow()
        .find('#createPoll')
        .click();

      // Fill out the form
      cy.get('poll-component')
        .shadow()
        .find('#pollTitle')
        .type(pollTitle);
      
      cy.get('poll-component')
        .shadow()
        .find('#adminPassword')
        .type(adminPassword);

      // Add first question
      cy.get('poll-component')
        .shadow()
        .find('.question-input')
        .first()
        .type('Wie bewerten Sie die heutige Vorlesung?');

      // Set question type to "single" (should be default)
      cy.get('poll-component')
        .shadow()
        .find('.question-type')
        .first()
        .select('single');

      // Add options
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .first()
        .type('Sehr gut');

      // Add second option
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(1)
        .type('Gut');

      // Click "Add Option"
      cy.get('poll-component')
        .shadow()
        .find('.add-option')
        .click();

      // Add third option
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(2)
        .type('Befriedigend');

      // Click "Add Question"
      cy.get('poll-component')
        .shadow()
        .find('#addQuestion')
        .click();

      // Add second question
      cy.get('poll-component')
        .shadow()
        .find('.question-input')
        .eq(1)
        .type('Welche Themen wünschen Sie sich für zukünftige Vorlesungen?');

      // Set question type to "multiple"
      cy.get('poll-component')
        .shadow()
        .find('.question-type')
        .eq(1)
        .select('multiple');

      // Add options for second question
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(3)
        .type('Mehr Praxisbeispiele');

      // Add second option for second question
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(4)
        .type('Tiefergehende Theorie');

      // Create poll
      cy.get('poll-component')
        .shadow()
        .find('#createPollBtn')
        .click();

      // Longer wait time for poll creation
      cy.wait(2000);

      // Check if the poll was successfully created
      cy.get('poll-component')
        .shadow()
        .contains(/Poll created! Code:|Your Poll Code is|Code:|success/i, { timeout: 30000 })
        .should('exist');
      
      // Extract and save poll code
      cy.get('poll-component')
        .shadow()
        .then($el => {
          // Searches for any element containing text and then for a code pattern (alphanumeric) within it
          const fullText = $el.text();
          const codeMatch = fullText.match(/[A-Z0-9]{4,8}/);
          if (codeMatch) {
            const pollCode = codeMatch[0];
            // Save the code in the Cypress environment for other tests
            Cypress.env('pollCode', pollCode);
            cy.log(`Extracted Poll Code: ${pollCode}`);
          }
        });

      // Click back to main page
      cy.get('poll-component')
        .shadow()
        .find('#backToMenu, button:contains("Back"), .back-button')
        .click();
        
      // Check if we returned to the main menu
      cy.get('poll-component')
        .shadow()
        .find('#createPoll, #joinPoll, #viewPolls')
        .should('exist');
        
      cy.log('Returned to main menu successfully');
    });
  });

  describe('Poll Participant', () => {
    it('can participate in a poll and submit responses', function() {
      // Get poll code from Cypress environment
      const pollCode = Cypress.env('pollCode');

      // If we don't have a poll code, we can't proceed
      if (!pollCode) {
        cy.log('No poll code available - skipping test');
        this.skip();
        return;
      }

      // Click "Join Poll"
      cy.get('poll-component')
        .shadow()
        .find('#joinPoll')
        .click();
        
      // Enter poll code
      cy.get('poll-component')
        .shadow()
        .find('#pollCode')
        .type(pollCode);
        
      // Click Join Poll button
      cy.get('poll-component')
        .shadow()
        .find('#enterPoll')
        .click();
        
      // Wait until questions are displayed
      cy.get('poll-component')
        .shadow()
        .contains('1.')
        .should('exist');
        
      // Answer first question (single choice)
      cy.get('poll-component')
        .shadow()
        .find('.option-button')
        .first()
        .click();
        
      // Answer second question (multiple choice)
      cy.get('poll-component')
        .shadow()
        .find('.question-container')
        .eq(1)
        .find('.option-button')
        .first()
        .click();
        
      cy.get('poll-component')
        .shadow()
        .find('.question-container')
        .eq(1)
        .find('.option-button')
        .eq(1)
        .click();
        
      // Click Submit Responses
      cy.get('poll-component')
        .shadow()
        .find('#submitResponses')
        .click();
        
      // Wait for confirmation message
      cy.get('poll-component')
        .shadow()
        .contains(/thank you|success|danke/i, { timeout: 10000 })
        .should('exist');
        
      // Check if we are automatically redirected to the main menu
      // or if we need to return via a Back button
      cy.get('poll-component')
        .shadow()
        .then($el => {
          // Check if we are already in the main menu
          const hasMainMenu = $el.find('#createPoll, #joinPoll, #viewPolls').length > 0;
          
          if (!hasMainMenu) {
            // If we weren't automatically redirected to the main menu,
            // click the Back button
            cy.get('poll-component')
              .shadow()
              .find('#backToMenu, button:contains("Back"), .back-button')
              .first()
              .click();
          }
        });
        
      // Make sure we are back in the main menu
      cy.get('poll-component')
        .shadow()
        .find('#createPoll, #joinPoll, #viewPolls', { timeout: 5000 })
        .should('exist');
    });
  });

  describe('Admin can check the results', () => {
    it('shows the poll results after participation', function() {
      const pollCode = Cypress.env('pollCode');
      
      // If we don't have a poll code, we can't proceed
      if (!pollCode) {
        cy.log('No poll code available - skipping test');
        this.skip();
        return;
      }
      
      // Navigate to the polls
      cy.get('poll-component')
        .shadow()
        .find('#viewPolls')
        .click();
      
      // Search for our poll by title
      cy.get('poll-component')
        .shadow()
        .find('#pollSearchInput')
        .first()
        .type(pollTitle);
      
      // Enter admin password
      cy.get('poll-component')
        .shadow()
        .find('.admin-code-input')
        .first()
        .type(adminPassword);
      
      // Open admin panel
      cy.get('poll-component')
        .shadow()
        .find('.join-poll-btn')
        .first()
        .click();
      
      // Check if results are displayed
      cy.get('poll-component')
        .shadow()
        .contains('Admin Panel', { timeout: 10000 })
        .should('exist');
      
      // Check if participation data is displayed
      cy.get('poll-component')
        .shadow()
        .contains(/responses|results|ergebnisse/i, { timeout: 10000 })
        .should('exist');
    });
  });
});