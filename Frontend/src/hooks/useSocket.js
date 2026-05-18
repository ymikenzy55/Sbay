import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../store/AuthContext';
import { getToken } from '../api/client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';

/**
 * Hook that manages a Socket.IO connection authenticated with the current user's token.
 * The token is read from localStorage and the socket reconnects whenever the user
 * (login/logout) changes.
 */
export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      // Silent in production; helpful in dev.
      // eslint-disable-next-line no-console
      console.warn('[socket] connect_error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, connected, on, off };
}
