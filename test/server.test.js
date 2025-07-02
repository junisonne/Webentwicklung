import request from 'supertest';
import app from '../backend/server.js';

describe('Poll API', () => {
  let newCode;
  const password = '2secure4you';

  it('GET /polls gets polls', async () => {
    const res = await request(app).get('/polls');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.polls)).toBe(true);
  });

  it('POST /poll/create creates new poll', async () => {
    const res = await request(app)
      .post('/poll/create')
      .send({
        title: 'SAP best company',
        adminPassword: password,
        questions: [
          { question: 'Are you happy to work at sap?', type: 'single', options: ['Yes', 'Absolutely'] }
        ]
      })
      .set('Accept', 'application/json');
    newCode = res.body.code;
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('code');
    expect(res.body.poll.questionsCount).toBe(1);
  });

  it('POST /poll/enter enters a poll', async () => {
    const res = await request(app)
      .post('/poll/enter')
      .send({ code: newCode })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.poll.code).toBe(newCode);
  });

  it('GET /poll/:code returns poll details', async () => {
    const res = await request(app).get(`/poll/${newCode}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('SAP best company');
    expect(res.body.responseCount).toBe(0);
  });

  it('POST /poll/:code/respond records a response', async () => {
    const res = await request(app)
      .post(`/poll/${newCode}/respond`)
      .send({ responses: ['Yes'] })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.responseId).toBe(1);
  });

  it('POST /poll/:code/admin returns results', async () => {
    const res = await request(app)
      .post(`/poll/${newCode}/admin`)
      .send({ adminPassword: password })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.poll.code).toBe(newCode);
    expect(res.body.poll.totalResponses).toBe(1);
    expect(res.body.results[0].results.Yes).toBe(1);
  });

  it('POST /poll/ban bans an IP', async () => {
    const mockIp = '123.45.67.89';
    const res = await request(app)
      .post('/poll/ban')
      .send({ ip: mockIp, code: newCode })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain(mockIp);
  });

  it('POST /poll/unban unbans an IP', async () => {
    const mockIp = '123.45.67.89';
    const res = await request(app)
      .post('/poll/unban')
      .send({ ip: mockIp, code: newCode })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain(mockIp);
  });

  it('PUT /poll/:code/toggle toggles poll active state', async () => {
    const res = await request(app)
      .put(`/poll/${newCode}/toggle`)
      .send({ adminPassword: password })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.active).toBe(false);
  });
});
