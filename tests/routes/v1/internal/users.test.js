jest.mock('../../../../services/UserService', () => ({
  upsertUser: jest.fn(),
  deleteUser: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../../app');
const UserService = require('../../../../services/UserService');
const authHeader = require('../../../helpers/authHeader');
const serviceAuthHeader = require('../../../helpers/serviceAuthHeader');

describe('internal users routes', () => {
  const originalSecret = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = originalSecret;
    jest.clearAllMocks();
  });

  describe('PUT /api/v1/internal/users/:uuid', () => {
    it('rejects the request without a token', async () => {
      const response = await request(app)
        .put('/api/v1/internal/users/uuid-1')
        .send({ name: 'Ada', lastname: 'Lovelace', fullName: 'Ada Lovelace' });

      expect(response.status).toBe(401);
      expect(UserService.upsertUser).not.toHaveBeenCalled();
    });

    it('rejects a regular user token (not a service token)', async () => {
      const response = await request(app)
        .put('/api/v1/internal/users/uuid-1')
        .set(authHeader())
        .send({ name: 'Ada', lastname: 'Lovelace', fullName: 'Ada Lovelace' });

      expect(response.status).toBe(403);
      expect(UserService.upsertUser).not.toHaveBeenCalled();
    });

    it('upserts the user when authenticated as the service', async () => {
      const user = {
        id: 1,
        uuid: 'uuid-1',
        name: 'Ada',
        lastname: 'Lovelace',
        fullName: 'Ada Lovelace',
      };
      UserService.upsertUser.mockResolvedValue(user);

      const response = await request(app)
        .put('/api/v1/internal/users/uuid-1')
        .set(serviceAuthHeader())
        .send({ name: 'Ada', lastname: 'Lovelace', fullName: 'Ada Lovelace' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(user);
      expect(UserService.upsertUser).toHaveBeenCalledWith({
        uuid: 'uuid-1',
        name: 'Ada',
        lastname: 'Lovelace',
        fullName: 'Ada Lovelace',
      });
    });

    it('returns 400 when a required field is missing', async () => {
      const response = await request(app)
        .put('/api/v1/internal/users/uuid-1')
        .set(serviceAuthHeader())
        .send({ name: 'Ada' });

      expect(response.status).toBe(400);
      expect(UserService.upsertUser).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/internal/users/:uuid', () => {
    it('soft-deletes the user when authenticated as the service', async () => {
      UserService.deleteUser.mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/internal/users/uuid-1')
        .set(serviceAuthHeader());

      expect(response.status).toBe(204);
      expect(UserService.deleteUser).toHaveBeenCalledWith('uuid-1');
    });
  });
});
