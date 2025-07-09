import request from 'supertest'
import app from '../backend/server.js'

describe('Poll API', () => {
  let newCode
  const password = '2secure4you'

  it('GET /polls should return an array of polls', async () => {
    const res = await request(app).get('/polls')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.polls)).toBe(true)
  })

  it('POST /poll/create should create a new poll', async () => {
    const res = await request(app)
      .post('/poll/create')
      .send({
        title: 'SAP best company',
        adminPassword: password,
        questions: [
          { question: 'Are you happy at SAP?', type: 'single', options: ['Yes','Absolutely'] }
        ]
      })
      .set('Accept', 'application/json')

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('code')
    expect(res.body.poll.questionsCount).toBe(1)
    newCode = res.body.code
  })

  it('POST /poll/enter should let you join the poll', async () => {
    const res = await request(app)
      .post('/poll/enter')
      .send({ code: newCode })
      .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
    expect(res.body.poll.code).toBe(newCode)
  })

  it('GET /poll/:code should return poll details', async () => {
    const res = await request(app).get(`/poll/${newCode}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.title).toBe('SAP best company')
    expect(res.body.responseCount).toBe(0)
  })

  it('POST /poll/:code/respond should record a response', async () => {
    const res = await request(app)
      .post(`/poll/${newCode}/respond`)
      .send({ responses: ['Yes'] })
      .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
    expect(res.body.responseId).toBe(1)
  })

  it('POST /poll/:code/admin should return results', async () => {
    const res = await request(app)
      .post(`/poll/${newCode}/admin`)
      .send({ adminPassword: password })
      .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
    expect(res.body.poll.code).toBe(newCode)
    expect(res.body.poll.totalResponses).toBe(1)
    expect(res.body.results[0].results.Yes).toBe(1)
  })

  it('POST /poll/ban and /poll/unban should work', async () => {
    const ip = '123.45.67.89'
    let res = await request(app)
      .post('/poll/ban')
      .send({ ip: ip, code: newCode })
      .set('Accept', 'application/json')
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(ip)

    // unban
    res = await request(app)
      .post('/poll/unban')
      .set('X-Forwarded-For', ip)
      .send({ code: newCode })
      .set('Accept', 'application/json')
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(ip)
  })
})
