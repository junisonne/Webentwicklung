import * as api from '../frontend/api';
const BASE_URL = 'http://localhost:8500';

beforeEach(() => {
  // Mock global.fetch vor jedem Test
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

// Hilfsfunktion, die ein fetch-ähnliches Response-Objekt zurückgibt
function mockFetch(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  });
}

describe('API client', () => {
  describe('joinPoll()', () => {
    it('soll POST /poll/enter aufrufen und Daten zurückliefern', async () => {
      const mockData = { code: 'X1', question: [] };
      fetch.mockReturnValueOnce(mockFetch(200, mockData));

      const result = await api.joinPoll('X1');
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/enter`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'X1' }),
        }
      );
      expect(result).toEqual(mockData);
    });

    it('soll bei Fehlerstatus eine Exception mit Status werfen', async () => {
      fetch.mockReturnValueOnce(mockFetch(403, { message: 'Banned' }));
      await expect(api.joinPoll('X1')).rejects.toMatchObject({
        message: 'Banned',
        status: 403,
      });
    });
  });

  describe('submitResponses()', () => {
    it('soll POST /poll/:code/respond aufrufen', async () => {
      const responses = [{ q: 1, a: 'A' }];
      fetch.mockReturnValueOnce(mockFetch(200, { ok: true }));
      await api.submitResponses('C1', responses);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/C1/respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses }),
        }
      );
    });
  });

  describe('createPoll()', () => {
    it('soll POST /poll/create aufrufen und neuen Code liefern', async () => {
      const pollData = { title: 'Test' };
      fetch.mockReturnValueOnce(mockFetch(201, { code: 'NEW' }));

      const res = await api.createPoll(pollData);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pollData),
        }
      );
      expect(res.code).toBe('NEW');
    });
  });

  describe('getAdminData()', () => {
    it('soll POST /poll/:code/admin aufrufen', async () => {
      fetch.mockReturnValueOnce(mockFetch(200, { results: [] }));
      const res = await api.getAdminData('C1', 'pw');
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/C1/admin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: 'pw' }),
        }
      );
      expect(res.results).toBeDefined();
    });
  });

  describe('togglePollStatus()', () => {
    it('soll PUT /poll/:code/toggle aufrufen', async () => {
      fetch.mockReturnValueOnce(mockFetch(200, { active: false }));
      const res = await api.togglePollStatus('C1', 'pw');
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/C1/toggle`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: 'pw' }),
        }
      );
      expect(res.active).toBe(false);
    });
  });

  describe('banIP() & unbanIP()', () => {
    it('soll POST /poll/ban aufrufen', async () => {
      fetch.mockReturnValueOnce(mockFetch(200, { banned: true }));
      await api.banIP('1.2.3.4', 'C1');
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/ban`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip: '1.2.3.4', code: 'C1' }),
        }
      );
    });

    it('soll POST /poll/unban aufrufen', async () => {
      fetch.mockReturnValueOnce(mockFetch(200, { unbanned: true }));
      await api.unbanIP('1.2.3.4', 'C1');
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/poll/unban`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip: '1.2.3.4', code: 'C1' }),
        }
      );
    });
  });

  describe('getAllPolls()', () => {
    it('soll GET /polls aufrufen und eine Liste zurückliefern', async () => {
      const list = [{ code: 'A' }, { code: 'B' }];
      fetch.mockReturnValueOnce(mockFetch(200, list));

      const res = await api.getAllPolls();
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/polls`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(res).toEqual(list);
    });
  });
});
