jest.mock('../../models', () => ({
  sequelize: { transaction: jest.fn((callback) => callback('txn')) },
  Conversation: { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  ConversationParticipant: {
    bulkCreate: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  User: { findAll: jest.fn(), findOne: jest.fn() },
}));

const {
  sequelize,
  Conversation,
  ConversationParticipant,
  User,
} = require('../../models');
const ConversationService = require('../../services/ConversationService');

describe('ConversationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('creates the conversation with its participants inside a transaction', async () => {
      const users = [
        { id: 1, uuid: 'u1' },
        { id: 2, uuid: 'u2' },
      ];
      User.findAll.mockResolvedValue(users);
      const conversation = { id: 10 };
      Conversation.create.mockResolvedValue(conversation);

      const result = await ConversationService.createConversation({
        isGroup: false,
        name: undefined,
        participantUuids: ['u1', 'u2'],
      });

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Conversation.create).toHaveBeenCalledWith(
        { isGroup: false, name: undefined },
        { transaction: 'txn' }
      );
      expect(ConversationParticipant.bulkCreate).toHaveBeenCalledWith(
        [
          { conversationId: 10, userId: 1 },
          { conversationId: 10, userId: 2 },
        ],
        { transaction: 'txn' }
      );
      expect(result).toBe(conversation);
    });

    it('throws a 422 when a participant uuid is unknown', async () => {
      User.findAll.mockResolvedValue([{ id: 1, uuid: 'u1' }]);

      await expect(
        ConversationService.createConversation({ isGroup: false, participantUuids: ['u1', 'u2'] })
      ).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('getConversationsForUser', () => {
    it('returns conversations where the user participates', async () => {
      User.findOne.mockResolvedValue({ id: 1, uuid: 'u1' });
      const conversations = [{ id: 1 }];
      Conversation.findAll.mockResolvedValue(conversations);

      const result = await ConversationService.getConversationsForUser('u1');

      expect(Conversation.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { userId: 1 },
            required: true,
          },
        ],
      });
      expect(result).toBe(conversations);
    });

    it('throws a 404 when the user is unknown', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(ConversationService.getConversationsForUser('unknown')).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('getConversationById', () => {
    it('returns the conversation', async () => {
      const conversation = { id: 1 };
      Conversation.findByPk.mockResolvedValue(conversation);

      const result = await ConversationService.getConversationById(1);

      expect(result).toBe(conversation);
    });

    it('throws a 404 when not found', async () => {
      Conversation.findByPk.mockResolvedValue(null);

      await expect(ConversationService.getConversationById(1)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('addParticipant', () => {
    it('throws a 409 when the user is already a participant', async () => {
      Conversation.findByPk.mockResolvedValue({ id: 1 });
      User.findOne.mockResolvedValue({ id: 2, uuid: 'u2' });
      ConversationParticipant.findOne.mockResolvedValue({ id: 5 });

      await expect(ConversationService.addParticipant(1, 'u2')).rejects.toMatchObject({ status: 409 });
    });

    it('creates the participant when it does not exist yet', async () => {
      Conversation.findByPk.mockResolvedValue({ id: 1 });
      User.findOne.mockResolvedValue({ id: 2, uuid: 'u2' });
      ConversationParticipant.findOne.mockResolvedValue(null);
      const participant = { id: 5 };
      ConversationParticipant.create.mockResolvedValue(participant);

      const result = await ConversationService.addParticipant(1, 'u2');

      expect(ConversationParticipant.create).toHaveBeenCalledWith({ conversationId: 1, userId: 2 });
      expect(result).toBe(participant);
    });
  });

  describe('removeParticipant', () => {
    it('throws a 404 when the participant does not exist', async () => {
      User.findOne.mockResolvedValue({ id: 2, uuid: 'u2' });
      ConversationParticipant.destroy.mockResolvedValue(0);

      await expect(ConversationService.removeParticipant(1, 'u2')).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
