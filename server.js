const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } 
});

const chatHistory = []; 
const connectedUsers = new Map(); 

// Servir la carpeta 'public'
app.use(express.static('public'));

io.on('connection', (socket) => {
  const userId = socket.id;
  
  socket.on('newUser', (username) => {
    if (connectedUsers.has(userId)) return; 

    const user = username || `Invitado-${Math.floor(Math.random() * 1000)}`;
    connectedUsers.set(userId, user);

    console.log(`🟢 Usuario conectado: ${user} (${userId})`);
    
    const connectMsg = {
        user: 'Sistema', 
        text: `${user} se ha unido al chat.`, 
        timestamp: new Date().toLocaleTimeString()
    };
    io.emit('notification', connectMsg);

    socket.emit('history', chatHistory);
    io.emit('usersConnected', connectedUsers.size); 
  });

  socket.on('chatMessage', (msgText) => {
    const user = connectedUsers.get(userId) || 'Desconocido';
    const message = {
        user: user,
        text: msgText,
        timestamp: new Date().toLocaleTimeString()
    };
    
    chatHistory.push(message);
    if (chatHistory.length > 50) chatHistory.shift(); 
    
    io.emit('chatMessage', message);
    console.log(`[${message.timestamp}] ${message.user}: ${message.text}`);
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(userId);
    if (user) {
        console.log(`🔴 Usuario desconectado: ${user} (${userId})`);
        connectedUsers.delete(userId);
        
        const disconnectMsg = {
            user: 'Sistema', 
            text: `${user} ha abandonado el chat.`, 
            timestamp: new Date().toLocaleTimeString()
        };
        io.emit('notification', disconnectMsg);
        io.emit('usersConnected', connectedUsers.size);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));