jest.mock('../../../services/ConversationService', () => ({
  createConversation: jest.fn(),
  getConversationsForUser: jest.fn(),
  getConversationById: jest.fn(),
  addParticipant: jest.fn(),
  removeParticipant: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../app');
const ConversationService = require('../../../services/ConversationService');
const authHeader = require('../../helpers/authHeader');

describe('conversations routes', () => {
  const originalSecret = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = originalSecret;
    jest.clearAllMocks();
  });

  describe('POST /api/v1/conversations', () => {
    it('creates a conversation', async () => {
      const conversation = { id: 1 };
      ConversationService.createConversation.mockResolvedValue(conversation);

      const response = await request(app)
        .post('/api/v1/conversations')
        .set(authHeader())
        .send({ isGroup: false, participantUuids: ['u1', 'u2'] });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ data: conversation });
      expect(ConversationService.createConversation).toHaveBeenCalledWith({
        isGroup: false,
        name: undefined,
        participantUuids: ['u1', 'u2'],
      });
    });

    it('returns 400 when fewer than 2 participants are given', async () => {
      const response = await request(app)
        .post('/api/v1/conversations')
        .set(authHeader())
        .send({ participantUuids: ['u1'] });

      expect(response.status).toBe(400);
      expect(ConversationService.createConversation).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/conversations', () => {
    it('requires a bearer token', async () => {
      const response = await request(app).get('/api/v1/conversations');

      expect(response.status).toBe(401);
    });

    it('returns the conversations for the authenticated user', async () => {
      const conversations = [{ id: 1 }];
      ConversationService.getConversationsForUser.mockResolvedValue(conversations);

      const response = await request(app)
        .get('/api/v1/conversations')
        .set(authHeader('u1'));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: conversations });
      expect(ConversationService.getConversationsForUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('GET /api/v1/conversations/:id', () => {
    it('returns the conversation detail', async () => {
      const conversation = { id: 1 };
      ConversationService.getConversationById.mockResolvedValue(conversation);

      const response = await request(app).get('/api/v1/conversations/1').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: conversation });
    });
  });

  describe('POST /api/v1/conversations/:id/participants', () => {
    it('adds a participant', async () => {
      const participant = { id: 1 };
      ConversationService.addParticipant.mockResolvedValue(participant);

      const response = await request(app)
        .post('/api/v1/conversations/1/participants')
        .set(authHeader())
        .send({ userUuid: 'u3' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ data: participant });
      expect(ConversationService.addParticipant).toHaveBeenCalledWith('1', 'u3');
    });

    it('returns 400 when userUuid is missing', async () => {
      const response = await request(app)
        .post('/api/v1/conversations/1/participants')
        .set(authHeader())
        .send({});

      expect(response.status).toBe(400);
      expect(ConversationService.addParticipant).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/conversations/:id/participants/:userUuid', () => {
    it('removes a participant', async () => {
      ConversationService.removeParticipant.mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/conversations/1/participants/u3')
        .set(authHeader());

      expect(response.status).toBe(204);
      expect(ConversationService.removeParticipant).toHaveBeenCalledWith('1', 'u3');
    });
  });
});
