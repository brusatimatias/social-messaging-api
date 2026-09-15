function buildNotification(overrides = {}) {
  return {
    id: 1,
    title: 'New message',
    content: 'hi',
    userId: 1,
    messageId: 1,
    isRead: false,
    ...overrides,
  };
}

module.exports = buildNotification;
