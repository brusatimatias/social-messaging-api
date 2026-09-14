const { Server } = require('socket.io');
const Service = require('../services/Service');

function initSockets(httpServer) {
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });

    socket.on('sendMessage', async ({ roomId, senderId, content }) => {
      const message = await Service.createMessage({ roomId, senderId, content });
      io.to(roomId).emit('newMessage', message);
    });
  });

  return io;
}

module.exports = initSockets;
