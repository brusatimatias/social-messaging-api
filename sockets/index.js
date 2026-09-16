const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const MessageService = require('../services/MessageService');
const { User, ConversationParticipant } = require('../models');
const getCorsOrigins = require('../utils/corsOrigins');

function initSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: getCorsOrigins() } });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Missing auth token'));
    }

    try {
      const payload = jwt.verify(token, process.env.SECRET_KEY);

      if (!payload.uuid) {
        return next(new Error('Invalid token payload'));
      }

      socket.userUuid = payload.uuid;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', async (conversationId) => {
      const user = await User.findOne({ where: { uuid: socket.userUuid } });
      if (!user) {
        return;
      }

      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: user.id },
      });
      if (!participant) {
        return;
      }

      socket.join(String(conversationId));
    });

    socket.on('sendMessage', async ({ conversationId, senderId, content }) => {
      const message = await MessageService.createMessage({ conversationId, senderId, content });
      io.to(String(conversationId)).emit('newMessage', message);
    });
  });

  return io;
}

module.exports = initSockets;
