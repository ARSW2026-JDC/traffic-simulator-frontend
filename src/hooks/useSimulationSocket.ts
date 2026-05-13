import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '../stores/simulationStore';
import { useAuthStore } from '../stores/authStore';
import type { SimulationFullState, SimulationDelta, SimulationSummary } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useSimulationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const lastJoinedSimId = useRef<string | null>(null);
  const lastHistoryRefetch = useRef<number>(0);
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
    deselect,
  } = useSimulationStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(`${GATEWAY}/simulation`, {
      path: '/sim/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      const activeSimId = useSimulationStore.getState().activeSimId;
      if (activeSimId) {
        socket.emit('sync:request', { simId: activeSimId });
        socket.emit('routes:request');
        lastJoinedSimId.current = activeSimId;
      } else {
        socket.emit('sync:request');
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('simulation:full-state', (state: SimulationFullState) => {
      setFullState(state.vehicles, state.trafficLights, state.tick);

      const activeSimId = useSimulationStore.getState().activeSimId;
      if (!activeSimId) return;

      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      // History handled by useHistorySocket
    });

    socket.on('simulation:delta', (delta: SimulationDelta) => {
      applyDelta(delta);

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

    socket.on('error', (error: { message: string }) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      setConnected(false);
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
    }
  }, [activeSimId]);

  return socketRef;
}
