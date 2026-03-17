import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useHistoryStore } from '../stores/historyStore';
import { useAuthStore } from '../stores/authStore';
import { getHistory } from '../services/api';
import type { ChangeLogEntry } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useHistorySocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const { addEntry, setEntries, setLoading } = useHistoryStore();

  useEffect(() => {
    setLoading(true);
    getHistory(50)
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const socket = io(`${GATEWAY}/history`, {
      path: '/nrt/socket.io',
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('history:new', (entry: ChangeLogEntry) => addEntry(entry));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
}
