'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketListener = (...args: unknown[]) => void;

/**
 * Hook for Socket.IO client connection
 */
export function useSocket(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.warn('✅ Socket connected:', socket.id);
      setIsConnected(true);

      // Authenticate user if userId is provided
      if (userId) {
        socket.emit('authenticate', userId);
      }
    });

    socket.on('disconnect', () => {
      console.warn('❌ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Join order room
  const joinOrder = (orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-order', orderId);
    }
  };

  // Leave order room
  const leaveOrder = (orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-order', orderId);
    }
  };

  // Join delivery room
  const joinDelivery = (orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-delivery', orderId);
    }
  };

  // Leave delivery room
  const leaveDelivery = (orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-delivery', orderId);
    }
  };

  // Join restaurant room
  const joinRestaurant = (restaurantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-restaurant', restaurantId);
    }
  };

  // Leave restaurant room
  const leaveRestaurant = (restaurantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-restaurant', restaurantId);
    }
  };

  // Update driver location
  const updateLocation = (orderId: string, latitude: number, longitude: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update-location', {
        orderId,
        latitude,
        longitude,
      });
    }
  };

  // Subscribe to event
  const on = (event: string, callback: SocketListener) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Unsubscribe from event
  const off = (event: string, callback?: SocketListener) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinOrder,
    leaveOrder,
    joinDelivery,
    leaveDelivery,
    joinRestaurant,
    leaveRestaurant,
    updateLocation,
    on,
    off,
  };
}
