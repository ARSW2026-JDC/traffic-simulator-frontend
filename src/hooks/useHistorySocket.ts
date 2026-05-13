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
  const loadMoreRef = useRef<(() => void) | null>(null);
  const { token, user } = useAuthStore();
  const activeSimId = useSimulationStore((s) => s.activeSimId);
  const {
    addEntry,
    appendEntries,
    setEntries,
    setLoading,
    setLoadingMore,
    setHasMore,
    setCursor,
    reset,
  } = useHistoryStore();

  useEffect(() => {
    let cancelled = false;

    if (!token || !user || !activeSimId) {
      reset();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const requestedSimId = activeSimId;
    reset();
    setLoading(true);

    const fetchHistory = (nextCursor?: string) => {
      if (nextCursor) setLoadingMore(true);
      getHistory(50, nextCursor, requestedSimId)
        .then((data) => {
          if (cancelled) return;
          if (useSimulationStore.getState().activeSimId !== requestedSimId) return;
          if (!Array.isArray(data)) return;

          if (nextCursor) {
            appendEntries(data);
          } else {
            setEntries(data);
          }

          const last = data[data.length - 1];
          setCursor(last?.id ?? null);
          setHasMore(data.length === 50);
        })
        .catch(() => {})
        .finally(() => {
          if (cancelled) return;
          if (useSimulationStore.getState().activeSimId !== requestedSimId) return;
          if (!nextCursor) setLoading(false);
          if (nextCursor) setLoadingMore(false);
        });
    };

    void fetchHistory();

    loadMoreRef.current = () => {
      if (cancelled) return;
      const { cursor, hasMore, isLoadingMore } = useHistoryStore.getState();
      if (!hasMore || isLoadingMore || !cursor) return;
      fetchHistory(cursor);
    };

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

  return { socketRef, loadMoreRef };
}
