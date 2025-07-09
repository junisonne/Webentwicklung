import { generatePollResultsCSV, downloadCSV } from '../frontend/utils/csvUtils';

describe('CSV Utils', () => {
  describe('generatePollResultsCSV()', () => {
    it('returns empty string if data is missing or incomplete', () => {
      expect(generatePollResultsCSV()).toBe('');
      expect(generatePollResultsCSV({})).toBe('');
      expect(generatePollResultsCSV({ poll: {} })).toBe('');
    });

    it('creates correctly formatted CSV lines for a simple poll', () => {
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

      // Header lines
      expect(csv[0]).toBe(`"Poll: ${data.poll.title}"`);
      expect(csv[1]).toBe(`"Code: ${data.poll.code}"`);
      expect(csv[2]).toBe(`"Total Responses: ${data.poll.totalResponses}"`);
      expect(csv[3]).toMatch(/^"Created: /);

      // Separator line
      expect(csv[4]).toBe('');

      // Question and column headers
      expect(csv[5]).toBe(`"Question 1: ${data.results[0].question}"`);
      expect(csv[6]).toBe(`"Option","Votes","Percentage"`);

      // Result lines
      expect(csv).toContain(`"A",2,66.7%`);
      expect(csv).toContain(`"B",1,33.3%`);
    });
  });

  describe('downloadCSV()', () => {
    it('is a function', () => {
      expect(typeof downloadCSV).toBe('function');
    });

    // Optional: DOM-based tests for downloadCSV() require mocks of
    // document.createElement and link.click, which are not covered here.
  });
});
