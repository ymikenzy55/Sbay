/**
 * Socket.IO server setup for real-time notifications.
 * Admins join an "admin" room to receive live events.
 */
import { Server } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';
import { User } from './models/User.js';
import { env } from './config/env.js';

let io = null;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }
  return env.CORS_ORIGINS.includes(origin);
}

/**
 * Initialise Socket.IO on an existing HTTP server.
 * Mirrors the HTTP auth middleware so role changes take effect immediately.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (isAllowedOrigin(origin)) return cb(null, true);
        return cb(new Error('CORS not allowed'));
      },
      credentials: true,
    },
  });

  // Authenticate socket connections via JWT in handshake auth.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);  // { sub, role }
      const user = await User.findById(decoded.sub).select('_id role restricted');
      if (!user || user.restricted) return next(new Error('Account unavailable'));
      socket.user = { id: user._id.toString(), role: user.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    socket.join(`user:${user.id}`);
    if (user.role === 'admin') socket.join('admin');
  });

  return io;
}

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
