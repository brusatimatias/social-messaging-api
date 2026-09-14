jest.mock('../../../services/Service', () => ({
  getMessagesByRoom: jest.fn(),
  createMessage: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../app');
const Service = require('../../../services/Service');

describe('GET /api/v1/conversations/:roomId/messages', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the messages for the room', async () => {
    const messages = [
      { id: 1, roomId: 'room-1', senderId: 1, content: 'hi' },
      { id: 2, roomId: 'room-1', senderId: 2, content: 'hello' },
    ];
    Service.getMessagesByRoom.mockResolvedValue(messages);

    const response = await request(app).get('/api/v1/conversations/room-1/messages');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(messages);
    expect(Service.getMessagesByRoom).toHaveBeenCalledWith('room-1');
  });
});
