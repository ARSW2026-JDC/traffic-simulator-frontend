import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useHistoryStore } from '../stores/historyStore';
import { useAuthStore } from '../stores/authStore';
import { useSimulationStore } from '../stores/simulationStore';
import { getHistory } from '../services/api';
import type { ChangeLogEntry } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useHistorySocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const activeSimId = useSimulationStore((s) => s.activeSimId);
  const { addEntry, setEntries, setLoading } = useHistoryStore();

  useEffect(() => {
    let cancelled = false;

    if (!token || !user || !activeSimId) {
      setEntries([]);
      setLoading(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const requestedSimId = activeSimId;
    setEntries([]);
    setLoading(true);

    const fetchHistory = () =>
      getHistory(50, undefined, requestedSimId)
        .then((data) => {
          if (cancelled) return;
          if (useSimulationStore.getState().activeSimId !== requestedSimId) return;
          setEntries(data);
        })
        .catch(() => {})
        .finally(() => {
          if (cancelled) return;
          if (useSimulationStore.getState().activeSimId !== requestedSimId) return;
          setLoading(false);
        });

    void fetchHistory();

    const socket = io(`${GATEWAY}/history`, {
      path: '/history/socket.io',
      auth: { token, simId: requestedSimId },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      void fetchHistory();
    });

    socket.on('history:new', (entry: ChangeLogEntry) => addEntry(entry));

    return () => {
      cancelled = true;
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [token, user, activeSimId]);

  return socketRef;
}
