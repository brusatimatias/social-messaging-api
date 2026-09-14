const { Server } = require('socket.io');
const Service = require('../services/Service');

function initSockets(httpServer) {
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    socket.on('joinRoom', (conversationId) => {
      socket.join(String(conversationId));
    });

    socket.on('sendMessage', async ({ conversationId, senderId, content }) => {
      const message = await Service.createMessage({ conversationId, senderId, content });
      io.to(String(conversationId)).emit('newMessage', message);
    });
  });

  return io;
}

module.exports = initSockets;
