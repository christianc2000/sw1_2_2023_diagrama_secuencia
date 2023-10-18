const express = require('express');
const app = express();
const path = require('path');

// Importa la función de inicialización de WebSocket
const initWebSocket = require('./socket');
//settings
app.set('port', process.env.PORT || 3000);

// static files, apunta al index como inicio e la pagina
app.use(express.static(path.join(__dirname, 'public')));

//start the server

const server = app.listen(app.get('port'), () => {
    console.log("server on port", app.get('port'));

});
initWebSocket(server);

// routes
//app.use('/api', require('./src/route/index.routes'));
