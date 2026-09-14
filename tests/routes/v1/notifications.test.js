jest.mock('../../../services/NotificationService', () => ({
  getNotificationsForUser: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../app');
const NotificationService = require('../../../services/NotificationService');
const authHeader = require('../../helpers/authHeader');

describe('GET /api/v1/notifications', () => {
  const originalSecret = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = originalSecret;
    jest.clearAllMocks();
  });

  it('requires a bearer token', async () => {
    const response = await request(app).get('/api/v1/notifications');

    expect(response.status).toBe(401);
  });

  it('returns the notifications for the authenticated user', async () => {
    const notifications = [{ id: 1, title: 'New message' }];
    NotificationService.getNotificationsForUser.mockResolvedValue(notifications);

    const response = await request(app).get('/api/v1/notifications').set(authHeader('u1'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(notifications);
    expect(NotificationService.getNotificationsForUser).toHaveBeenCalledWith('u1');
  });
});
