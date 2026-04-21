import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '../stores/simulationStore';
import { useAuthStore } from '../stores/authStore';
import type { SimulationFullState, SimulationDelta, SimulationSummary } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useSimulationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const { setFullState, applyDelta, setConnected, setRoutes, setSimulationList, setActiveSimId } =
    useSimulationStore();

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
      socket.emit('sync:request');
      socket.emit('routes:request');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('simulation:full-state', (state: SimulationFullState) => {
      setFullState(state.vehicles, state.trafficLights, state.tick);
    });

    socket.on('simulation:delta', (delta: SimulationDelta) => {
      applyDelta(delta);
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
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  return socketRef;
}
