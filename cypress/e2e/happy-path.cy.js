describe('Poll System - Happy Path', () => {
  // Testdaten für die Umfrageerstellung
  const pollTitle = 'Test Vorlesungsfeedback';
  const adminPassword = 'admin123';
  
  beforeEach(() => {
    // Visit the app using baseUrl from cypress.config.js
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(1000); // Längere Pause für DOM-Rendering und Netzwerkanfragen
  });

  describe('Umfrageersteller (Admin)', () => {
    it('kann eine Umfrage erstellen und zum Hauptmenü zurückkehren', () => {
      // Klick auf den Button "Create Poll as Admin"
      cy.get('poll-component')
        .shadow()
        .find('#createPoll')
        .click();

      // Formular ausfüllen
      cy.get('poll-component')
        .shadow()
        .find('#pollTitle')
        .type(pollTitle);
      
      cy.get('poll-component')
        .shadow()
        .find('#adminPassword')
        .type(adminPassword);

      // Erste Frage hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.question-input')
        .first()
        .type('Wie bewerten Sie die heutige Vorlesung?');

      // Frage-Typ auf "single" setzen (sollte bereits Standard sein)
      cy.get('poll-component')
        .shadow()
        .find('.question-type')
        .first()
        .select('single');

      // Optionen hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .first()
        .type('Sehr gut');

      // Zweite Option hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(1)
        .type('Gut');

      // "Add Option" klicken
      cy.get('poll-component')
        .shadow()
        .find('.add-option')
        .click();

      // Dritte Option hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(2)
        .type('Befriedigend');

      // "Add Question" klicken
      cy.get('poll-component')
        .shadow()
        .find('#addQuestion')
        .click();

      // Zweite Frage hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.question-input')
        .eq(1)
        .type('Welche Themen wünschen Sie sich für zukünftige Vorlesungen?');

      // Frage-Typ auf "multiple" setzen
      cy.get('poll-component')
        .shadow()
        .find('.question-type')
        .eq(1)
        .select('multiple');

      // Optionen für zweite Frage hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(3)
        .type('Mehr Praxisbeispiele');

      // Zweite Option für zweite Frage hinzufügen
      cy.get('poll-component')
        .shadow()
        .find('.option-input')
        .eq(4)
        .type('Tiefergehende Theorie');

      // Umfrage erstellen
      cy.get('poll-component')
        .shadow()
        .find('#createPollBtn')
        .click();

      // Längere Wartezeit für die Erstellung der Umfrage
      cy.wait(2000);

      // Prüfen, ob die Poll erfolgreich erstellt wurde
      cy.get('poll-component')
        .shadow()
        .contains(/Poll created! Code:|Your Poll Code is|Code:/i, { timeout: 10000 })
        .should('exist');
      
      // Umfragecode extrahieren und speichern
      cy.get('poll-component')
        .shadow()
        .then($el => {
          // Sucht nach jedem Element, das Text enthält und dann nach einem Code-Muster (alphanumerisch) darin
          const fullText = $el.text();
          const codeMatch = fullText.match(/[A-Z0-9]{4,8}/);
          if (codeMatch) {
            const pollCode = codeMatch[0];
            // Speichere den Code in der Cypress-Umgebung für andere Tests
            Cypress.env('pollCode', pollCode);
            cy.log(`Extracted Poll Code: ${pollCode}`);
          }
        });

      // Zurück zur Hauptseite klicken
      cy.get('poll-component')
        .shadow()
        .find('#backToMenu, button:contains("Back"), .back-button')
        .click();
        
      // Überprüfen, ob wir zurück zum Hauptmenü gelangt sind
      cy.get('poll-component')
        .shadow()
        .find('#createPoll, #joinPoll, #viewPolls')
        .should('exist');
        
      cy.log('Returned to main menu successfully');
    });
  });

  describe('Umfrageteilnehmer', () => {
    it('kann an einer Umfrage teilnehmen und Antworten absenden', function() {
      // Pollcode aus der Cypress-Umgebung abrufen
      const pollCode = Cypress.env('pollCode');

      // Wenn wir keinen Umfragecode haben, können wir nicht fortfahren
      if (!pollCode) {
        cy.log('Kein Umfragecode verfügbar - Test wird übersprungen');
        this.skip();
        return;
      }

      // "Join Poll" klicken
      cy.get('poll-component')
        .shadow()
        .find('#joinPoll')
        .click();
        
      // Pollcode eingeben
      cy.get('poll-component')
        .shadow()
        .find('#pollCode')
        .type(pollCode);
        
      // Join Poll Button klicken
      cy.get('poll-component')
        .shadow()
        .find('#enterPoll')
        .click();
        
      // Warten bis die Fragen angezeigt werden
      cy.get('poll-component')
        .shadow()
        .contains('1.')
        .should('exist');
        
      // Erste Frage beantworten (single choice)
      cy.get('poll-component')
        .shadow()
        .find('.option-button')
        .first()
        .click();
        
      // Zweite Frage beantworten (multiple choice)
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
        
      // Submit Responses klicken
      cy.get('poll-component')
        .shadow()
        .find('#submitResponses')
        .click();
        
      // Warten auf die Bestätigungsmeldung
      cy.get('poll-component')
        .shadow()
        .contains(/thank you|success|danke/i, { timeout: 10000 })
        .should('exist');
        
      // Prüfen, ob wir automatisch zum Hauptmenü zurückgeleitet werden
      // oder ob wir über einen Back-Button zurückkehren müssen
      cy.get('poll-component')
        .shadow()
        .then($el => {
          // Prüfen ob wir bereits im Hauptmenü sind
          const hasMainMenu = $el.find('#createPoll, #joinPoll, #viewPolls').length > 0;
          
          if (!hasMainMenu) {
            // Falls wir nicht automatisch zum Hauptmenü weitergeleitet wurden,
            // klicken wir den Back-Button
            cy.get('poll-component')
              .shadow()
              .find('#backToMenu, button:contains("Back"), .back-button')
              .first()
              .click();
          }
        });
        
      // Sicherstellen, dass wir zurück im Hauptmenü sind
      cy.get('poll-component')
        .shadow()
        .find('#createPoll, #joinPoll, #viewPolls', { timeout: 5000 })
        .should('exist');
    });
  });

  describe('Admin kann die Ergebnisse überprüfen', () => {
    it('zeigt die Umfrageergebnisse nach der Teilnahme an', function() {
      const pollCode = Cypress.env('pollCode');
      
      // Wenn wir keinen Umfragecode haben, können wir nicht fortfahren
      if (!pollCode) {
        cy.log('Kein Umfragecode verfügbar - Test wird übersprungen');
        this.skip();
        return;
      }
      
      // Zu den Polls navigieren
      cy.get('poll-component')
        .shadow()
        .find('#viewPolls')
        .click();
      
      // Nach unserem Poll suchen mit dem Titel
      cy.get('poll-component')
        .shadow()
        .find('#pollSearchInput')
        .first()
        .type(pollTitle);
      
      // Admin-Passwort eingeben
      cy.get('poll-component')
        .shadow()
        .find('.admin-code-input')
        .first()
        .type(adminPassword);
      
      // Admin-Panel öffnen
      cy.get('poll-component')
        .shadow()
        .find('.join-poll-btn')
        .first()
        .click();
      
      // Prüfen, ob die Ergebnisse angezeigt werden
      cy.get('poll-component')
        .shadow()
        .contains('Admin Panel', { timeout: 10000 })
        .should('exist');
      
      // Prüfen, ob die Teilnahmedaten angezeigt werden
      cy.get('poll-component')
        .shadow()
        .contains(/responses|results|ergebnisse/i, { timeout: 10000 })
        .should('exist');
    });
  });
});