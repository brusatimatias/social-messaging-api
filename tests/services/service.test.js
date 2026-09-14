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
      const created = { id: 1, roomId: 'room-1', senderId: 1, content: 'hi' };
      Message.create.mockResolvedValue(created);

      const result = await Service.createMessage({ roomId: 'room-1', senderId: 1, content: 'hi' });

      expect(Message.create).toHaveBeenCalledWith({ roomId: 'room-1', senderId: 1, content: 'hi' });
      expect(result).toBe(created);
    });
  });

  describe('getMessagesByRoom', () => {
    it('fetches messages ordered by creation date', async () => {
      const messages = [{ id: 1 }, { id: 2 }];
      Message.findAll.mockResolvedValue(messages);

      const result = await Service.getMessagesByRoom('room-1');

      expect(Message.findAll).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        order: [['createdAt', 'ASC']],
      });
      expect(result).toBe(messages);
    });
  });
});
