const Message = require('../models/Message');

async function createMessage({ conversationId, senderId, content }) {
  return Message.create({ conversationId, senderId, content });
}

async function getMessagesByConversation(conversationId) {
  return Message.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
  });
}

module.exports = {
  createMessage,
  getMessagesByConversation,
};
