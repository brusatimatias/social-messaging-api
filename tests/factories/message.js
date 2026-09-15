function buildMessage(overrides = {}) {
  return {
    id: 1,
    conversationId: 1,
    senderId: 1,
    content: 'hi',
    ...overrides,
  };
}

module.exports = buildMessage;
