import { useEffect, useRef } from 'react';
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
  onConnectionChange?: (connected: boolean) => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    socket?.disconnect();
    socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.25,
      timeout: 10000,
    });

    const onConnect = () => {
      handlersRef.current?.onConnectionChange?.(true);
    };
    const onDisconnect = () => {
      handlersRef.current?.onConnectionChange?.(false);
    };
    const onConnectError = (error: Error) => {
      console.warn('WebSocket connection error:', error.message);
      handlersRef.current?.onConnectionChange?.(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('lead:update', (data) => handlersRef.current?.onLeadUpdate?.(data));
    socket.on('task:update', (data) => handlersRef.current?.onTaskUpdate?.(data));
    socket.on('invoice:update', (data) => handlersRef.current?.onInvoiceUpdate?.(data));
    socket.on('notification', (data) => handlersRef.current?.onNotification?.(data));

    const handleAuthExpired = () => socket?.disconnect();
    window.addEventListener('amplify:auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('amplify:auth-expired', handleAuthExpired);
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('connect_error', onConnectError);
      socket?.disconnect();
      socket = null;
    };
  }, []);
}

export function emitSocket(event: string, data?: any) {
  if (socket?.connected) socket.emit(event, data);
}
