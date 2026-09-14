jest.mock('../../models/Message', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
}));

const Message = require('../../models/Message');
const Service = require('../../services/Service');

describe('Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('persists a message via the Message model', async () => {
      const created = { id: 1, conversationId: 1, senderId: 1, content: 'hi' };
      Message.create.mockResolvedValue(created);

      const result = await Service.createMessage({ conversationId: 1, senderId: 1, content: 'hi' });

      expect(Message.create).toHaveBeenCalledWith({ conversationId: 1, senderId: 1, content: 'hi' });
      expect(result).toBe(created);
    });
  });

  describe('getMessagesByConversation', () => {
    it('fetches messages ordered by creation date', async () => {
      const messages = [{ id: 1 }, { id: 2 }];
      Message.findAll.mockResolvedValue(messages);

      const result = await Service.getMessagesByConversation(1);

      expect(Message.findAll).toHaveBeenCalledWith({
        where: { conversationId: 1 },
        order: [['createdAt', 'ASC']],
      });
      expect(result).toBe(messages);
    });
  });
});
