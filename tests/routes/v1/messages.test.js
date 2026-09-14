jest.mock('../../../services/MessageService', () => ({
  getMessagesByConversation: jest.fn(),
  createMessage: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../app');
const MessageService = require('../../../services/MessageService');
const authHeader = require('../../helpers/authHeader');

describe('messages routes', () => {
  const originalSecret = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = originalSecret;
    jest.clearAllMocks();
  });

  describe('GET /api/v1/conversations/:conversationId/messages', () => {
    it('requires a bearer token', async () => {
      const response = await request(app).get('/api/v1/conversations/1/messages');

      expect(response.status).toBe(401);
    });

    it('returns the messages for the conversation', async () => {
      const messages = [
        { id: 1, conversationId: 1, senderId: 1, content: 'hi' },
        { id: 2, conversationId: 1, senderId: 2, content: 'hello' },
      ];
      MessageService.getMessagesByConversation.mockResolvedValue(messages);

      const response = await request(app)
        .get('/api/v1/conversations/1/messages')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toEqual(messages);
      expect(MessageService.getMessagesByConversation).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /api/v1/conversations/:conversationId/messages', () => {
    it('creates a message and returns it', async () => {
      const created = { id: 1, conversationId: 1, senderId: 1, content: 'hi' };
      MessageService.createMessage.mockResolvedValue(created);

      const response = await request(app)
        .post('/api/v1/conversations/1/messages')
        .set(authHeader())
        .send({ senderId: 1, content: 'hi' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(created);
      expect(MessageService.createMessage).toHaveBeenCalledWith({
        conversationId: '1',
        senderId: 1,
        content: 'hi',
      });
    });

    it('returns 400 when senderId or content is missing', async () => {
      const response = await request(app)
        .post('/api/v1/conversations/1/messages')
        .set(authHeader())
        .send({ senderId: 1 });

      expect(response.status).toBe(400);
      expect(MessageService.createMessage).not.toHaveBeenCalled();
    });
  });
});
