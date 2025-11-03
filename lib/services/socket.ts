import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from '@/lib/prisma';
import { SocketEvent } from '@/lib/types';

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room for specific user
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join room for specific order
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Client joined order room: ${orderId}`);
    });

    // Join room for restaurant
    socket.on('join:restaurant', (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`Client joined restaurant room: ${restaurantId}`);
    });

    // Driver location update
    socket.on('driver:location', async (data: {
      orderId: string;
      latitude: number;
      longitude: number;
      driverId: string;
    }) => {
      try {
        // Update delivery location in database
        await prisma.delivery.update({
          where: { orderId: data.orderId },
          data: {
            currentLatitude: data.latitude,
            currentLongitude: data.longitude,
          },
        });

        // Broadcast to order room
        io?.to(`order:${data.orderId}`).emit(SocketEvent.DRIVER_LOCATION_UPDATE, {
          orderId: data.orderId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    });

    // Order status update
    socket.on('order:status', async (data: {
      orderId: string;
      status: string;
    }) => {
      try {
        // Broadcast to order room
        io?.to(`order:${data.orderId}`).emit(SocketEvent.ORDER_STATUS_CHANGED, {
          orderId: data.orderId,
          status: data.status,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error broadcasting order status:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper functions to emit events
export function emitOrderUpdate(orderId: string, data: any) {
  if (io) {
    io.to(`order:${orderId}`).emit(SocketEvent.ORDER_UPDATED, data);
  }
}

export function emitOrderStatusChange(orderId: string, status: string) {
  if (io) {
    io.to(`order:${orderId}`).emit(SocketEvent.ORDER_STATUS_CHANGED, {
      orderId,
      status,
      timestamp: new Date(),
    });
  }
}

export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit(SocketEvent.NOTIFICATION_NEW, notification);
  }
}

export function emitDriverLocation(orderId: string, location: {
  latitude: number;
  longitude: number;
}) {
  if (io) {
    io.to(`order:${orderId}`).emit(SocketEvent.DRIVER_LOCATION_UPDATE, {
      ...location,
      timestamp: new Date(),
    });
  }
}

export function emitToRestaurant(restaurantId: string, event: string, data: any) {
  if (io) {
    io.to(`restaurant:${restaurantId}`).emit(event, data);
  }
}
