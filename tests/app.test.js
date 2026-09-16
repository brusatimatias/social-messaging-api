const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
  it('responds with the API welcome message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Social Messaging API' });
  });
});
