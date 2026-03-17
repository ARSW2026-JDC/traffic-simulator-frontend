import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '../stores/simulationStore';
import { useAuthStore } from '../stores/authStore';
import type { SimulationFullState, SimulationDelta } from '../types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useSimulationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const { setFullState, applyDelta, setConnected, setRoutes } = useSimulationStore();

  useEffect(() => {
    const socket = io(`${GATEWAY}/simulation`, {
      path: '/sim/socket.io',
      auth: { token: token || '' },
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

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
}
