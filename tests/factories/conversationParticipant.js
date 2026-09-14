function buildConversationParticipant(overrides = {}) {
  return {
    id: 1,
    conversationId: 1,
    userId: 1,
    ...overrides,
  };
}

module.exports = buildConversationParticipant;
