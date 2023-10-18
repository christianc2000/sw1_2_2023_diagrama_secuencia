const socketIO = require('socket.io');

function initWebSocket(server) {
  const io = socketIO(server);

  
  io.on('connection', (socket) => {
    console.log('Nueva conexión:', socket.id);
    socket.emit('user_id', { id: socket.id });
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
    //evento escucha que un nodo se mueve
    socket.on('movenode:diagram', (data) => {
      console.log('nodos movidos:', data);
      socket.broadcast.emit('movenode:diagram', data);
    });
    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
    socket.on('linknode:diagram', (data) => {
      console.log("link creado: ", data);
      socket.broadcast.emit('linknode:diagram', data);
    });
    socket.on('deleteElement:diagram', (data) => {
      console.log("link a eliminar: ", data);
      socket.broadcast.emit('deleteElement:diagram', data);
    });
    socket.on('editGroupText:diagram', (data) => {
      console.log("nodo editado: ", data);
      //socket.broadcast.emit('editGroupText:diagram', data);
    });
  });
}

module.exports = initWebSocket;
