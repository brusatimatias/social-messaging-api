process.env.SECRET_KEY = 'test-secret';

jest.mock('../services/MessageService', () => ({
  createMessage: jest.fn(),
  getMessagesByConversation: jest.fn(),
}));

jest.mock('../models', () => ({
  User: { findOne: jest.fn() },
  ConversationParticipant: { findOne: jest.fn() },
}));

const http = require('http');
const jwt = require('jsonwebtoken');
const { io: ioClient } = require('socket.io-client');
const initSockets = require('../sockets');
const MessageService = require('../services/MessageService');
const { User, ConversationParticipant } = require('../models');
const buildUser = require('./factories/user');
const buildConversationParticipant = require('./factories/conversationParticipant');
const buildMessage = require('./factories/message');

describe('sockets', () => {
  let httpServer;
  let port;
  let url;

  beforeAll((done) => {
    httpServer = http.createServer();
    initSockets(httpServer);
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      url = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects the connection when no auth token is provided', (done) => {
    const client = ioClient(url, { transports: ['websocket'] });

    client.on('connect_error', (error) => {
      expect(error.message).toBe('Missing auth token');
      client.close();
      done();
    });
  });

  it('joins the room only when the user is a participant, then broadcasts new messages', (done) => {
    const token = jwt.sign({ uuid: 'user-uuid-1' }, process.env.SECRET_KEY);
    const message = buildMessage({ content: 'hi there' });

    User.findOne.mockResolvedValue(buildUser({ id: 1, uuid: 'user-uuid-1' }));
    ConversationParticipant.findOne.mockResolvedValue(buildConversationParticipant());
    MessageService.createMessage.mockResolvedValue(message);

    const client = ioClient(url, { transports: ['websocket'], auth: { token } });

    client.on('connect', () => {
      client.emit('joinRoom', 1);
      setTimeout(() => {
        client.emit('sendMessage', { conversationId: 1, senderId: 1, content: 'hi there' });
      }, 50);
    });

    client.on('newMessage', (received) => {
      expect(received).toEqual(message);
      expect(User.findOne).toHaveBeenCalledWith({ where: { uuid: 'user-uuid-1' } });
      expect(ConversationParticipant.findOne).toHaveBeenCalledWith({
        where: { conversationId: 1, userId: 1 },
      });
      client.close();
      done();
    });
  });
});
