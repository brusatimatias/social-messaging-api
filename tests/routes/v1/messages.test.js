jest.mock('../../../services/Service', () => ({
  getMessagesByConversation: jest.fn(),
  createMessage: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../app');
const Service = require('../../../services/Service');

describe('GET /api/v1/conversations/:conversationId/messages', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the messages for the conversation', async () => {
    const messages = [
      { id: 1, conversationId: 1, senderId: 1, content: 'hi' },
      { id: 2, conversationId: 1, senderId: 2, content: 'hello' },
    ];
    Service.getMessagesByConversation.mockResolvedValue(messages);

    const response = await request(app).get('/api/v1/conversations/1/messages');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(messages);
    expect(Service.getMessagesByConversation).toHaveBeenCalledWith('1');
  });
});
