function buildConversation(overrides = {}) {
  return {
    id: 1,
    isGroup: false,
    name: null,
    ...overrides,
  };
}

module.exports = buildConversation;
