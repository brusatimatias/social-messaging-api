jest.mock('../../models', () => ({
  User: { findOrCreate: jest.fn(), destroy: jest.fn() },
}));

const { User } = require('../../models');
const UserService = require('../../services/UserService');

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertUser', () => {
    it('creates a new user when it did not exist yet', async () => {
      const created = { id: 1, uuid: 'uuid-1', update: jest.fn() };
      User.findOrCreate.mockResolvedValue([created, true]);

      const result = await UserService.upsertUser({
        uuid: 'uuid-1',
        name: 'Ada',
        lastname: 'Lovelace',
        fullName: 'Ada Lovelace',
      });

      expect(User.findOrCreate).toHaveBeenCalledWith({
        where: { uuid: 'uuid-1' },
        defaults: { name: 'Ada', lastname: 'Lovelace', fullName: 'Ada Lovelace' },
      });
      expect(created.update).not.toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it('updates the user when it already existed', async () => {
      const existing = { id: 1, uuid: 'uuid-1', update: jest.fn().mockResolvedValue() };
      User.findOrCreate.mockResolvedValue([existing, false]);

      await UserService.upsertUser({
        uuid: 'uuid-1',
        name: 'Ada',
        lastname: 'Lovelace',
        fullName: 'Ada Lovelace',
      });

      expect(existing.update).toHaveBeenCalledWith({
        name: 'Ada',
        lastname: 'Lovelace',
        fullName: 'Ada Lovelace',
      });
    });
  });

  describe('deleteUser', () => {
    it('soft-deletes the user', async () => {
      User.destroy.mockResolvedValue(1);

      await UserService.deleteUser('uuid-1');

      expect(User.destroy).toHaveBeenCalledWith({ where: { uuid: 'uuid-1' } });
    });

    it('throws a 404 when no user matched', async () => {
      User.destroy.mockResolvedValue(0);

      await expect(UserService.deleteUser('uuid-1')).rejects.toMatchObject({ status: 404 });
    });
  });
});
