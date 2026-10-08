
const { Server } = require('socket.io');
const { env } = require('./env');

function createSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.emit('connection', { status: 'connected' });
  });

  return io;
}

module.exports = { createSocketServer };
