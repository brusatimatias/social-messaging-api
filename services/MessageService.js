const { Message, ConversationParticipant, Notification } = require('../models');

async function createMessage({ conversationId, senderId, content }) {
  const message = await Message.create({ conversationId, senderId, content });

  const participants = await ConversationParticipant.findAll({ where: { conversationId } });
  const recipients = participants.filter((participant) => participant.userId !== senderId);

  if (recipients.length > 0) {
    await Notification.bulkCreate(
      recipients.map((participant) => ({
        title: 'New message',
        content,
        userId: participant.userId,
        messageId: message.id,
      }))
    );
  }

  return message;
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
