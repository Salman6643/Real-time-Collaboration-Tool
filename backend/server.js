import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST']
  }
});

// In-memory rooms
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    socket.data.userName = userName || 'Anonymous';
    socket.data.roomId = roomId;

    if (!rooms.has(roomId)) rooms.set(roomId, { users: new Set() });
    rooms.get(roomId).users.add(socket.id);

    // notify others
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userName: socket.data.userName
    });

    // send current users list to the joined socket
    const users = Array.from(rooms.get(roomId).users);
    socket.emit('room-users', { users });
  });

  socket.on('drawing', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('drawing', data);
  });

  socket.on('chat-message', (msg) => {
    const roomId = socket.data.roomId;
    if (roomId) {
      const payload = { text: msg, from: socket.data.userName, id: socket.id, ts: Date.now() };
      io.to(roomId).emit('chat-message', payload);
    }
  });

  socket.on('clear-canvas', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('clear-canvas');
  });

  socket.on('cursor-move', (cursor) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('cursor-move', { socketId: socket.id, cursor });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).users.delete(socket.id);
      socket.to(roomId).emit('user-left', { socketId: socket.id });
      if (rooms.get(roomId).users.size === 0) rooms.delete(roomId);
    }
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
