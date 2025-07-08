// test/csv-utils.test.js
import { generatePollResultsCSV, downloadCSV } from '../frontend/utils/csv-utils';

describe('CSV Utils', () => {
  describe('generatePollResultsCSV()', () => {
    it('gibt leeren String zurück, wenn data fehlt oder unvollständig ist', () => {
      expect(generatePollResultsCSV()).toBe('');
      expect(generatePollResultsCSV({})).toBe('');
      expect(generatePollResultsCSV({ poll: {} })).toBe('');
    });

    it('erstellt korrekt formatierte CSV-Zeilen für eine einfache Umfrage', () => {
      const data = {
        poll: {
          title: 'Testumfrage',
          code: 'T1',
          totalResponses: 3,
          createdAt: '2020-01-02T12:00:00Z'
        },
        results: [
          {
            question: 'Frage 1',
            results: { A: 2, B: 1 },
            totalResponses: 3
          }
        ]
      };
      const csv = generatePollResultsCSV(data).split('\n');

      // Header-Zeilen
      expect(csv[0]).toBe(`"Poll: ${data.poll.title}"`);
      expect(csv[1]).toBe(`"Code: ${data.poll.code}"`);
      expect(csv[2]).toBe(`"Total Responses: ${data.poll.totalResponses}"`);
      expect(csv[3]).toMatch(/^"Created: /);

      // Trennzeile
      expect(csv[4]).toBe('');

      // Frage und Spaltenüberschriften
      expect(csv[5]).toBe(`"Question 1: ${data.results[0].question}"`);
      expect(csv[6]).toBe(`"Option","Votes","Percentage"`);

      // Ergebniszeilen
      expect(csv).toContain(`"A",2,66.7%`);
      expect(csv).toContain(`"B",1,33.3%`);
    });
  });

  describe('downloadCSV()', () => {
    it('ist eine Funktion', () => {
      expect(typeof downloadCSV).toBe('function');
    });

    // Optional: DOM-basierte Tests für downloadCSV() erfordern Mocks von
    // document.createElement und link.click, die hier nicht abgedeckt sind.
  });
});
