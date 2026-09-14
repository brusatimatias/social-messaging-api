function buildUser(overrides = {}) {
  return {
    id: 1,
    uuid: 'user-uuid-1',
    name: 'Ada',
    lastname: 'Lovelace',
    fullName: 'Ada Lovelace',
    ...overrides,
  };
}

module.exports = buildUser;
