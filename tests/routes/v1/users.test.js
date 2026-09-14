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
      uuid: '2f1e2b0a-2b3a-4a7a-9a3b-0f1a2b3c4d5e',
      name: 'Ada',
      lastname: 'Lovelace',
      fullName: 'Ada Lovelace',
    });

    const response = await request(app).get('/api/v1/users/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      uuid: '2f1e2b0a-2b3a-4a7a-9a3b-0f1a2b3c4d5e',
      name: 'Ada',
      lastname: 'Lovelace',
      fullName: 'Ada Lovelace',
    });
    expect(User.findByPk).toHaveBeenCalledWith('1', {
      attributes: ['id', 'uuid', 'name', 'lastname', 'fullName'],
    });
  });

  it('returns 404 when the user does not exist', async () => {
    User.findByPk.mockResolvedValue(null);

    const response = await request(app).get('/api/v1/users/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });
});
