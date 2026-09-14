jest.mock('../../../models', () => ({
  User: { findOne: jest.fn() },
}));

const request = require('supertest');
const app = require('../../../app');
const { User } = require('../../../models');
const authHeader = require('../../helpers/authHeader');
const buildUser = require('../../factories/user');

describe('GET /api/v1/users/:uuid', () => {
  const originalSecret = process.env.SECRET_KEY;
  const uuid = '2f1e2b0a-2b3a-4a7a-9a3b-0f1a2b3c4d5e';

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = originalSecret;
    jest.clearAllMocks();
  });

  it('requires a bearer token', async () => {
    const response = await request(app).get(`/api/v1/users/${uuid}`);

    expect(response.status).toBe(401);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('returns the user when it exists', async () => {
    const user = buildUser({ uuid });
    User.findOne.mockResolvedValue(user);

    const response = await request(app).get(`/api/v1/users/${uuid}`).set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: user });
    expect(User.findOne).toHaveBeenCalledWith({
      where: { uuid },
      attributes: ['id', 'uuid', 'name', 'lastname', 'fullName'],
    });
  });

  it('returns 404 when the user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app).get(`/api/v1/users/${uuid}`).set(authHeader());

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: 'User not found' } });
  });
});
