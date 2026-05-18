/**
 * Socket.IO server setup for real-time notifications.
 * Admins join an "admin" room to receive live events.
 */
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';

let io = null;

/**
 * Initialise Socket.IO on an existing HTTP server.
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        // Same CORS logic as Express: allow any localhost in dev.
        if (!origin) return cb(null, true);
        if (env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return cb(null, true);
        }
        const allowed = (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (allowed.includes(origin)) return cb(null, true);
        cb(new Error('CORS not allowed'));
      },
      credentials: true,
    },
  });

  // Authenticate socket connections via JWT in auth handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    // Join user-specific room for personal notifications.
    socket.join(`user:${user.id}`);

    // Admins join the admin room for dashboard events.
    if (user.role === 'admin') {
      socket.join('admin');
    }

    socket.on('disconnect', () => {
      // Cleanup if needed.
    });
  });

  return io;
}

/** Get the Socket.IO server instance. */
export function getIO() {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}

/** Emit an event to all connected admins. */
export function emitToAdmins(event, payload) {
  if (io) io.to('admin').emit(event, payload);
}

/** Emit an event to a specific user. */
export function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}
