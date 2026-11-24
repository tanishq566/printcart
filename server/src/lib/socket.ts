import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { env } from '../config/env.js';
import { verifyToken } from '../utils/auth.js';

let io: SocketIOServer;

export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    // Check for optional JWT authentication in auth payload or cookies
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.cookie
        ? socket.handshake.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('token='))
            ?.split('=')[1]
        : null);

    if (token) {
      try {
        const payload = verifyToken(token);
        socket.data.user = payload;
      } catch (err) {
        // Allow unauthenticated connection for customers joining job:join
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // If shopkeeper is authenticated, automatically join shop room
    if (socket.data.user?.shopId) {
      const room = `shop:${socket.data.user.shopId}`;
      socket.join(room);
      console.log(`🏪 Authenticated socket ${socket.id} auto-joined ${room}`);
    }

    // Shopkeeper joins shop room (with verification if auth present)
    socket.on('shop:join', (requestedShopId: string) => {
      if (socket.data.user?.shopId && socket.data.user.shopId !== requestedShopId && socket.data.user.role !== 'SUPER_ADMIN') {
        console.warn(`Unauthorized attempt by ${socket.id} to join shop:${requestedShopId}`);
        return;
      }
      socket.join(`shop:${requestedShopId}`);
      console.log(`🏪 Socket ${socket.id} joined shop:${requestedShopId}`);
    });

    // Customer joins their specific job room
    socket.on('job:join', (jobId: string) => {
      socket.join(`job:${jobId}`);
      console.log(`📄 Socket ${socket.id} joined job:${jobId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocketIO first.');
  }
  return io;
}
