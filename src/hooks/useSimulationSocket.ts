import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '../stores/simulationStore';
import { useAuthStore } from '../stores/authStore';
import type { SimulationFullState, SimulationDelta, SimulationSummary, SimulationStats } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useSimulationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const lastJoinedSimId = useRef<string | null>(null);
  const lastHistoryRefetch = useRef<number>(0);
  const pendingDeltaRef = useRef<SimulationDelta | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFlushRef = useRef<number>(0);
  const { token, user } = useAuthStore();
  const activeSimId = useSimulationStore((s) => s.activeSimId);
  const {
    setFullState,
    applyDelta,
    setConnected,
    setRoutes,
    setSimulationList,
    setActiveSimId,
    setErrorMessage,
    setSimStats,
    deselect,
  } = useSimulationStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(`${GATEWAY}/simulation`, {
      path: '/sim/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.3,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[SimSocket] Connected:', socket.id);
      setConnected(true);
      const currentSimId = useSimulationStore.getState().activeSimId;
      if (currentSimId) {
        socket.emit('sync:request', { simId: currentSimId });
      } else {
        socket.emit('sync:request');
      }
    });

    socket.on('disconnect', (reason) => {
      console.info('[SimSocket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[SimSocket] Connect error:', err.message);
    });

    socket.on('reconnect_attempt', (attempt: number) => {
      console.info(`[SimSocket] Reconnect attempt #${attempt}`);
    });

    socket.on('reconnect', (attempt: number) => {
      console.info(`[SimSocket] Reconnected after ${attempt} attempts`);
      setConnected(true);
      const currentSimId = useSimulationStore.getState().activeSimId;
      if (currentSimId) {
        socket.emit('sync:request', { simId: currentSimId });
      } else {
        socket.emit('sync:request');
      }
    });

    socket.on('reconnect_failed', () => {
      console.warn('[SimSocket] Reconnect failed - will keep trying');
    });

    socket.on('simulation:full-state', (state: SimulationFullState) => {
      const currentSimId = useSimulationStore.getState().activeSimId;
      if (!currentSimId) return;
      if (currentSimId && state.simId && state.simId !== currentSimId) return;
      pendingDeltaRef.current = null;
      setFullState(state.vehicles, state.trafficLights, state.tick);

      const activeSimId = useSimulationStore.getState().activeSimId;
      if (!activeSimId) return;

      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      // History handled by useHistorySocket
    });

    socket.on('simulation:delta', (delta: SimulationDelta) => {
      const currentSimId = useSimulationStore.getState().activeSimId;
      if (!currentSimId) return;
      if (currentSimId && delta.simId && delta.simId !== currentSimId) return;
      pendingDeltaRef.current = mergeDelta(pendingDeltaRef.current, delta);
      scheduleDeltaFlush(currentSimId, applyDelta, pendingDeltaRef, rafRef, lastFlushRef);

      const activeSimId = useSimulationStore.getState().activeSimId;
      if (!activeSimId) return;

      const now = Date.now();
      if (now - lastHistoryRefetch.current < 500) return;
      lastHistoryRefetch.current = now;

      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      // History handled by useHistorySocket
    });

    socket.on('routes:list', (routes: { id: string; name: string }[]) => {
      setRoutes(routes);
    });

    socket.on('simulation:list-updated', (list: SimulationSummary[]) => {
      const nextList = Array.isArray(list) ? list : [];
      setSimulationList(nextList);

      const { activeSimId } = useSimulationStore.getState();
      if (activeSimId && !nextList.some((sim) => sim.simId === activeSimId)) {
        setActiveSimId(null);
        setFullState({}, {}, 0);
        setRoutes([]);
        deselect();
      }
    });

    socket.on('simulation:stats', (stats: SimulationStats) => {
      const currentSimId = useSimulationStore.getState().activeSimId;
      if (!currentSimId) return;
      if (currentSimId && stats.simId && stats.simId !== currentSimId) return;
      setSimStats(stats);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('[SimSocket] Error:', error.message);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      setConnected(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingDeltaRef.current = null;
      socket.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      lastJoinedSimId.current = activeSimId;
      return;
    }

    const prevSimId = lastJoinedSimId.current;
    if (prevSimId && prevSimId !== activeSimId) {
      socket.emit('leave', { simId: prevSimId });
    }

    if (activeSimId) {
      socket.emit('sync:request', { simId: activeSimId });
      socket.emit('routes:request');
      lastJoinedSimId.current = activeSimId;
    } else {
      lastJoinedSimId.current = null;
      pendingDeltaRef.current = null;
      lastFlushRef.current = 0;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [activeSimId]);

  return socketRef;
}

function mergeDelta(existing: SimulationDelta | null, incoming: SimulationDelta): SimulationDelta {
  if (!existing) return incoming;

  const vehicles = { ...existing.vehicles, ...incoming.vehicles };
  const trafficLights = { ...existing.trafficLights, ...incoming.trafficLights };

  const removedSet = new Set(existing.removed ?? []);
  for (const id of Object.keys(incoming.vehicles ?? {})) {
    removedSet.delete(id);
  }
  for (const id of Object.keys(incoming.trafficLights ?? {})) {
    removedSet.delete(id);
  }
  for (const id of incoming.removed ?? []) {
    removedSet.add(id);
  }

  return {
    simId: incoming.simId ?? existing.simId,
    vehicles,
    trafficLights,
    removed: Array.from(removedSet),
    tick: Math.max(existing.tick ?? 0, incoming.tick ?? 0),
    timestamp: Math.max(existing.timestamp ?? 0, incoming.timestamp ?? 0),
  };
}

function scheduleDeltaFlush(
  activeSimId: string,
  applyDelta: (delta: SimulationDelta) => void,
  pendingDeltaRef: { current: SimulationDelta | null },
  rafRef: { current: number | null },
  lastFlushRef: { current: number },
) {
  if (rafRef.current) return;

  const flush = (now: number) => {
    const elapsed = now - lastFlushRef.current;
    if (elapsed < 33) {
      rafRef.current = requestAnimationFrame(flush);
      return;
    }
    lastFlushRef.current = now;
    rafRef.current = null;

    const delta = pendingDeltaRef.current;
    if (!delta) return;

    const currentSimId = useSimulationStore.getState().activeSimId;
    if (!currentSimId || currentSimId !== activeSimId) {
      pendingDeltaRef.current = null;
      return;
    }

    pendingDeltaRef.current = null;
    applyDelta(delta);
  };

  rafRef.current = requestAnimationFrame(flush);
}
