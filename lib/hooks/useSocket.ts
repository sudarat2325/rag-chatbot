'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketListener = (...args: unknown[]) => void;

// Global socket instance (singleton)
let globalSocket: Socket | null = null;
let socketInitialized = false;
let currentAuthenticatedUser: string | undefined = undefined;

function getSocket(): Socket {
  if (!globalSocket && !socketInitialized) {
    socketInitialized = true;
    globalSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });
    console.warn('🔌 Global Socket.IO instance created');
  }
  return globalSocket!;
}

/**
 * Hook for Socket.IO client connection (singleton pattern)
 */
export function useSocket(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get or create global socket instance
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.warn('✅ Socket connected:', socket.id);
      setIsConnected(true);

      // Re-authenticate if userId changed
      if (userId && currentAuthenticatedUser !== userId) {
        socket.emit('authenticate', userId);
        currentAuthenticatedUser = userId;
        console.warn('🔐 Authenticated user:', userId);
      }
    };

    const handleDisconnect = () => {
      console.warn('❌ Socket disconnected');
      setIsConnected(false);
      currentAuthenticatedUser = undefined;
    };

    const handleConnectError = (error: Error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    };

    // Set initial state and authenticate
    if (socket.connected) {
      setIsConnected(true);
      // Re-authenticate if userId changed
      if (userId && currentAuthenticatedUser !== userId) {
        socket.emit('authenticate', userId);
        currentAuthenticatedUser = userId;
        console.warn('🔐 Re-authenticated user:', userId);
      }
    }

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Cleanup - only remove listeners, don't disconnect global socket
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [userId]);

  // Join order room
  const joinOrder = useCallback((orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-order', orderId);
    }
  }, []);

  // Leave order room
  const leaveOrder = useCallback((orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-order', orderId);
    }
  }, []);

  // Join delivery room
  const joinDelivery = useCallback((orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-delivery', orderId);
    }
  }, []);

  // Leave delivery room
  const leaveDelivery = useCallback((orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-delivery', orderId);
    }
  }, []);

  // Join restaurant room
  const joinRestaurant = useCallback((restaurantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-restaurant', restaurantId);
    }
  }, []);

  // Leave restaurant room
  const leaveRestaurant = useCallback((restaurantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-restaurant', restaurantId);
    }
  }, []);

  // Update driver location
  const updateLocation = useCallback((orderId: string, latitude: number, longitude: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update-location', {
        orderId,
        latitude,
        longitude,
      });
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, callback: SocketListener) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from event
  const off = useCallback((event: string, callback?: SocketListener) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

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
