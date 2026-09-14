jest.mock('../services/Service', () => ({
  createMessage: jest.fn(),
  getMessagesByRoom: jest.fn(),
}));

const http = require('http');
const { io: ioClient } = require('socket.io-client');
const initSockets = require('../sockets');
const Service = require('../services/Service');

describe('sockets', () => {
  let httpServer;
  let port;

  beforeAll((done) => {
    httpServer = http.createServer();
    initSockets(httpServer);
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('broadcasts a persisted message to everyone in the room', (done) => {
    const message = { id: 1, roomId: 'room-1', senderId: 1, content: 'hi there' };
    Service.createMessage.mockResolvedValue(message);

    const client = ioClient(`http://localhost:${port}`, { transports: ['websocket'] });

    client.on('connect', () => {
      client.emit('joinRoom', 'room-1');
      client.emit('sendMessage', { roomId: 'room-1', senderId: 1, content: 'hi there' });
    });

    client.on('newMessage', (received) => {
      expect(received).toEqual(message);
      expect(Service.createMessage).toHaveBeenCalledWith({
        roomId: 'room-1',
        senderId: 1,
        content: 'hi there',
      });
      client.close();
      done();
    });
  });
});
