const express = require('express');
const app = express();
const path = require('path');

// Importa la función de inicialización de WebSocket
const initWebSocket = require('./socket');
//settings
app.set('port', process.env.PORT || 8000);

// static files, apunta al index como inicio e la pagina
app.use(express.static(path.join(__dirname, 'public')));

//start the server
const server = app.listen(app.get('port'), () => {
    console.log("server on port", app.get('port'));

});
initWebSocket(server);
//Web socket
// const io = socketIO(server);
// io.on('connection', (socket) => {
//     console.log('new connection', socket.id);
//     //evento para cuando el usuario envía un mensaje
//     socket.on('diagrama:new_nodo', (data) => {
//         console.log("data: ", data);
//         socket.broadcast.emit('diagrama:new_nodo', data);
//     });
    
//     //evento para cuando el usuario esté escribiendo
//     socket.on('chat:typing', (data) => {
//         console.log("username: ", data);
//         socket.broadcast.emit('chat:typing', data) //para emitir a todos menos a mí
//         //io.sockets.emit('chat:message',data);
//     });
    
// });

// routes
//app.use('/api', require('./src/route/index.routes'));
