jest.mock('../../models', () => ({
  Message: { create: jest.fn(), findAll: jest.fn() },
  ConversationParticipant: { findAll: jest.fn() },
  Notification: { bulkCreate: jest.fn() },
}));

const { Message, ConversationParticipant, Notification } = require('../../models');
const MessageService = require('../../services/MessageService');
const buildMessage = require('../factories/message');
const buildConversationParticipant = require('../factories/conversationParticipant');

describe('MessageService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('persists the message and notifies the other participants', async () => {
      const created = buildMessage();
      Message.create.mockResolvedValue(created);
      ConversationParticipant.findAll.mockResolvedValue([
        buildConversationParticipant({ userId: 1 }),
        buildConversationParticipant({ userId: 2 }),
        buildConversationParticipant({ userId: 3 }),
      ]);

      const result = await MessageService.createMessage({ conversationId: 1, senderId: 1, content: 'hi' });

      expect(Message.create).toHaveBeenCalledWith({ conversationId: 1, senderId: 1, content: 'hi' });
      expect(ConversationParticipant.findAll).toHaveBeenCalledWith({ where: { conversationId: 1 } });
      expect(Notification.bulkCreate).toHaveBeenCalledWith([
        { title: 'New message', content: 'hi', userId: 2, messageId: 1 },
        { title: 'New message', content: 'hi', userId: 3, messageId: 1 },
      ]);
      expect(result).toBe(created);
    });

    it('does not notify anyone when the sender is the only participant', async () => {
      Message.create.mockResolvedValue(buildMessage());
      ConversationParticipant.findAll.mockResolvedValue([buildConversationParticipant({ userId: 1 })]);

      await MessageService.createMessage({ conversationId: 1, senderId: 1, content: 'hi' });

      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('getMessagesByConversation', () => {
    it('fetches messages ordered by creation date', async () => {
      const messages = [buildMessage({ id: 1 }), buildMessage({ id: 2 })];
      Message.findAll.mockResolvedValue(messages);

      const result = await MessageService.getMessagesByConversation(1);

      expect(Message.findAll).toHaveBeenCalledWith({
        where: { conversationId: 1 },
        order: [['createdAt', 'ASC']],
      });
      expect(result).toBe(messages);
    });
  });
});
