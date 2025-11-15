/**
 * Custom Next.js Server with Socket.IO
 *
 * This custom server integrates Socket.IO for real-time features:
 * - Order status updates
 * - Delivery tracking
 * - Real-time notifications
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import logger from './lib/logger/winston';
import { startSystemMetricsCollection } from './lib/logger/metrics';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Start collecting system metrics
startSystemMetricsCollection();

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// User-Socket mapping for targeted notifications
const userSockets = new Map<string, Set<string>>();

type DeliveryLocation = { latitude: number; longitude: number };
type DriverInfo = { id: string; name: string; phone: string };
type GenericPayload = Record<string, unknown>;

type ServerGlobals = typeof globalThis & {
  io?: SocketIOServer;
  emitOrderUpdate?: (orderId: string, status: string, data?: GenericPayload) => void;
  emitDeliveryUpdate?: (orderId: string, location: DeliveryLocation, driverInfo?: DriverInfo) => void;
  emitUserNotification?: (userId: string, notification: GenericPayload) => void;
  emitRestaurantNotification?: (restaurantId: string, notification: GenericPayload) => void;
  emitChatMessage?: (orderId: string, message: unknown) => void;
};

const serverGlobals = globalThis as ServerGlobals;

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error('Error occurred handling request', {
        url: req.url,
        method: req.method,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  // Make io instance globally available
  serverGlobals.io = io;

  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Handle user authentication
    socket.on('authenticate', (userId: string) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      socket.data.userId = userId;
      logger.info('User authenticated', { userId, socketId: socket.id });
    });

    // Join order room for real-time updates
    socket.on('join-order', (orderId: string) => {
      socket.join(`order-${orderId}`);
      logger.debug('Client joined order room', { socketId: socket.id, orderId });
    });

    // Leave order room
    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order-${orderId}`);
      logger.debug('Client left order room', { socketId: socket.id, orderId });
    });

    // Join delivery tracking room
    socket.on('join-delivery', (orderId: string) => {
      socket.join(`delivery-${orderId}`);
      logger.debug('Client joined delivery room', { socketId: socket.id, orderId });
    });

    // Leave delivery tracking room
    socket.on('leave-delivery', (orderId: string) => {
      socket.leave(`delivery-${orderId}`);
      logger.debug(`🚚 Client ${socket.id} left delivery room: ${orderId}`);
    });

    // Join restaurant room (for restaurant owners)
    socket.on('join-restaurant', (restaurantId: string) => {
      socket.join(`restaurant-${restaurantId}`);
      logger.debug(`🏪 Client ${socket.id} joined restaurant room: ${restaurantId}`);
    });

    // Leave restaurant room
    socket.on('leave-restaurant', (restaurantId: string) => {
      socket.leave(`restaurant-${restaurantId}`);
      logger.debug(`🏪 Client ${socket.id} left restaurant room: ${restaurantId}`);
    });

    // Update driver location
    socket.on('update-location', (data: {
      orderId: string;
      latitude: number;
      longitude: number;
    }) => {
      // Broadcast location update to delivery room
      io.to(`delivery-${data.orderId}`).emit('driver-location-updated', {
        orderId: data.orderId,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        timestamp: new Date().toISOString(),
      });
      logger.debug(`📍 Driver location updated for order ${data.orderId}`);
    });

    socket.on('disconnect', () => {
      // Remove socket from user mapping
      if (socket.data.userId) {
        const userId = socket.data.userId;
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
      logger.debug('❌ Client disconnected:', socket.id);
    });
  });

  // Helper functions for emitting events (accessible globally)
  serverGlobals.emitOrderUpdate = (orderId: string, status: string, data?: GenericPayload) => {
    io.to(`order-${orderId}`).emit('order-status-update', {
      orderId,
      status,
      data,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`📤 Emitted order status update for ${orderId}: ${status}`);
  };

  serverGlobals.emitDeliveryUpdate = (
    orderId: string,
    location: DeliveryLocation,
    driverInfo?: DriverInfo
  ) => {
    io.to(`delivery-${orderId}`).emit('delivery-location-update', {
      orderId,
      location,
      driverInfo,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`📍 Emitted delivery location update for ${orderId}`);
  };

  serverGlobals.emitUserNotification = (userId: string, notification: GenericPayload) => {
    const sockets = userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      sockets.forEach(socketId => {
        io.to(socketId).emit('notification', notification);
      });
      logger.debug(`🔔 Emitted notification to user ${userId}`);
    }
  };

  serverGlobals.emitRestaurantNotification = (
    restaurantId: string,
    notification: GenericPayload
  ) => {
    io.to(`restaurant-${restaurantId}`).emit('restaurant-notification', notification);
    logger.debug(`🏪 Emitted notification to restaurant ${restaurantId}`);
  };

  serverGlobals.emitChatMessage = (orderId: string, message: unknown) => {
    const roomName = `order-${orderId}`;
    const eventName = `chat-message-${orderId}`;

    // Get all sockets in this room
    const room = io.sockets.adapter.rooms.get(roomName);
    const socketsInRoom = room ? Array.from(room) : [];

    logger.debug(`💬 Emitting chat message:`, {
      room: roomName,
      event: eventName,
      socketsInRoom: socketsInRoom.length,
      socketIds: socketsInRoom,
      message: (message as {message?: string})?.message?.substring(0, 50),
    });

    io.to(roomName).emit(eventName, message);
  };

  // Start server
  server.listen(port, () => {
    logger.debug(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  🍕 Food Delivery System with RAG Chatbot               ║
║                                                          ║
║  ✓ Next.js Server: http://${hostname}:${port}${' '.repeat(Math.max(0, 21 - hostname.length - port.toString().length))}║
║  ✓ Socket.IO: Enabled at /api/socket                    ║
║  ✓ Environment: ${dev ? 'Development' : 'Production'}${' '.repeat(dev ? 31 : 28)}║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
});
