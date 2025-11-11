import type { Server as SocketIOServer } from 'socket.io';

type GlobalWithIO = typeof globalThis & {
  io?: SocketIOServer;
};

const globalWithIO = globalThis as GlobalWithIO;

/**
 * Socket.IO Helper Functions for API Routes
 *
 * These functions provide an interface to emit Socket.IO events from API routes.
 * The actual Socket.IO server is initialized in server.ts
 */

/**
 * Get Socket.IO instance from global
 */
function getSocketIO(): SocketIOServer | undefined {
  return globalWithIO.io;
}

/**
 * Emit order status update
 */
export function emitOrderStatusUpdate(orderId: string, status: string, data?: Record<string, unknown>) {
  const io = getSocketIO();

  if (!io) {
    console.warn('⚠️  Socket.IO not initialized');
    return;
  }

  io.to(`order-${orderId}`).emit('order-status-update', {
    orderId,
    status,
    data,
    timestamp: new Date().toISOString(),
  });

  console.warn(`📤 Emitted order status update for order ${orderId}: ${status}`);
}

/**
 * Emit delivery location update
 */
export function emitDeliveryLocationUpdate(
  orderId: string,
  location: { latitude: number; longitude: number },
  driverInfo?: { id: string; name: string; phone: string }
) {
  const io = getSocketIO();

  if (!io) {
    console.warn('⚠️  Socket.IO not initialized');
    return;
  }

  io.to(`delivery-${orderId}`).emit('delivery-location-update', {
    orderId,
    location,
    driverInfo,
    timestamp: new Date().toISOString(),
  });

  console.warn(`📍 Emitted location update for order ${orderId}:`, location);
}

/**
 * Emit notification to specific user
 */
export function emitUserNotification(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  const io = getSocketIO();

  if (!io) {
    console.warn('⚠️  Socket.IO not initialized');
    return;
  }

  // Emit to all sockets for this user
  // Note: You'll need to track user->socket mapping
  io.emit(`user-notification-${userId}`, notification);

  console.warn(`🔔 Emitted notification to user ${userId}`);
}

/**
 * Emit restaurant notification
 */
export function emitRestaurantNotification(
  restaurantId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  const io = getSocketIO();

  if (!io) {
    console.warn('⚠️  Socket.IO not initialized');
    return;
  }

  io.emit(`restaurant-notification-${restaurantId}`, notification);

  console.warn(`🏪 Emitted notification to restaurant ${restaurantId}`);
}
