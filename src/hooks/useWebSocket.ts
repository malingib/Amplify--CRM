import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../api/client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function useWebSocket(handlers?: {
  onLeadUpdate?: (data: any) => void;
  onTaskUpdate?: (data: any) => void;
  onInvoiceUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('lead:update', (data) => {
      handlersRef.current?.onLeadUpdate?.(data);
    });

    socket.on('task:update', (data) => {
      handlersRef.current?.onTaskUpdate?.(data);
    });

    socket.on('invoice:update', (data) => {
      handlersRef.current?.onInvoiceUpdate?.(data);
    });

    socket.on('notification', (data) => {
      handlersRef.current?.onNotification?.(data);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);
}

export function emitSocket(event: string, data?: any) {
  socket?.emit(event, data);
}
