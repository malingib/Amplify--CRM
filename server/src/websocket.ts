import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './lib/auth';
import { config } from './config';

let io: Server;

export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = verifyToken(token as string);
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${(socket as any).userId}`);

    // Join user-specific room
    socket.join(`user:${(socket as any).userId}`);

    // Join role-based room
    socket.join(`role:${(socket as any).userRole}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${(socket as any).userId}`);
    });
  });

  return io;
}

// Helper functions to broadcast events
export function broadcastLeadUpdate(lead: any, action: 'created' | 'updated' | 'deleted' | 'stage_changed') {
  if (!io) return;
  io.emit('lead:update', { lead, action, timestamp: new Date().toISOString() });
}

export function broadcastInvoiceUpdate(invoice: any, action: 'created' | 'updated' | 'paid') {
  if (!io) return;
  io.emit('invoice:update', { invoice, action, timestamp: new Date().toISOString() });
}

export function broadcastNotification(userId: string, notification: { title: string; message: string; type: string }) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', { ...notification, timestamp: new Date().toISOString() });
}

export function broadcastNotificationToRole(role: string, notification: { title: string; message: string; type: string }) {
  if (!io) return;
  io.to(`role:${role}`).emit('notification', { ...notification, timestamp: new Date().toISOString() });
}
