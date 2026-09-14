jest.mock('../../../models/User', () => ({
  findByPk: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');

describe('GET /api/v1/users/:id', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the user when it exists', async () => {
    User.findByPk.mockResolvedValue({
      id: 1,
      username: 'exampleUser',
      email: 'user@example.com',
    });

    const response = await request(app).get('/api/v1/users/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      username: 'exampleUser',
      email: 'user@example.com',
    });
    expect(User.findByPk).toHaveBeenCalledWith('1', {
      attributes: ['id', 'username', 'email'],
    });
  });

  it('returns 404 when the user does not exist', async () => {
    User.findByPk.mockResolvedValue(null);

    const response = await request(app).get('/api/v1/users/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });
});
