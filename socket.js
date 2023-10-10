const socketIO = require('socket.io');

function initWebSocket(server) {
  const io = socketIO(server);

  io.on('connection', (socket) => {
    console.log('Nueva conexión:', socket.id);

    // Maneja tus eventos de WebSocket aquí
    socket.on('diagrama:new_nodo', (data) => {
      console.log('Nuevo nodo:', data);
      socket.broadcast.emit('diagrama:new_nodo', data);
    });

    socket.on('save:diagram', (data) => {
      console.log('datos diagrama', data);
      socket.broadcast.emit('save:diagram', data);
    });
    socket.on('addnode:diagram', (data) => {
        console.log('datos diagrama', data);
        socket.broadcast.emit('addnode:diagram', data);
      });
      
    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });
}

module.exports = initWebSocket;
