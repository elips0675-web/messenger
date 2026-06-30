import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware.js';

let io = null;

export function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    console.log(`WS user:${userId} connected`);

    socket.on('join:chat', (chatId) => socket.join(`chat:${chatId}`));
    socket.on('leave:chat', (chatId) => socket.leave(`chat:${chatId}`));

    // Collaborative board
    socket.on('board:join', (boardId) => {
      socket.join(`board:${boardId}`);
      socket.boardId = boardId;
    });
    socket.on('board:draw', (data) => {
      socket.to(`board:${data.boardId}`).emit('board:draw', data);
    });
    socket.on('board:clear', (data) => {
      socket.to(`board:${data.boardId}`).emit('board:clear', data);
    });

    // Collaborative mindmap
    socket.on('mindmap:join', (mapId) => {
      socket.join(`mindmap:${mapId}`);
    });
    socket.on('mindmap:update', (data) => {
      socket.to(`mindmap:${data.mapId}`).emit('mindmap:update', data);
    });

    // WebRTC call signaling
    socket.on('call:ring', (data) => {
      io.to(`user:${data.to}`).emit('call:ring', { from: data.from, fromUserId: userId, video: data.video });
    });
    socket.on('call:accept', (data) => {
      io.to(`user:${data.to}`).emit('call:accepted', { from: userId });
    });
    socket.on('call:end', (data) => {
      io.to(`user:${data.to}`).emit('call:ended', { from: userId });
    });

    socket.on('disconnect', () => {
      console.log(`WS user:${userId} disconnected`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function sendMessageViaSocket(chatId, message, excludeUserId) {
  if (!io) return;
  if (message.user_id !== undefined || message.userId !== undefined) {
    const uid = message.user_id || message.userId;
    if (typeof uid === 'number') {
      io.to(`user:${uid}`).emit('message:new', { chatId, message });
    }
  }
  io.to(`chat:${chatId}`).emit('message:new', { chatId, message });
}
