const Message = require('../models/Message');

async function createMessage({ roomId, senderId, content }) {
  return Message.create({ roomId, senderId, content });
}

async function getMessagesByRoom(roomId) {
  return Message.findAll({
    where: { roomId },
    order: [['createdAt', 'ASC']],
  });
}

module.exports = {
  createMessage,
  getMessagesByRoom,
};
