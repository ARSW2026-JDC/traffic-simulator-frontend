import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSimulationStore } from '../stores/simulationStore';
import { useAuthStore } from '../stores/authStore';
import { io } from 'socket.io-client';
import type { SimulationFullState, SimulationDelta, SimulationSummary } from '../types';

// ── Mock socket.io-client ─────────────────────────────────────────────────────
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));
const mockIo = vi.mocked(io);

vi.mock('../services/firebase', () => ({
  auth: { currentUser: null },
}));

import { useSimulationSocket } from './useSimulationSocket';

const baseUser = { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER' as const, createdAt: '' };

describe('useSimulationSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: null, user: null, firebaseUser: null, isLoading: false });
    useSimulationStore.setState({
      vehicles: {},
      trafficLights: {},
      selectedId: null,
      selectedType: null,
      isConnected: false,
      tick: 0,
      routes: [],
      simulations: [],
      activeSimId: null,
      bbox: null,
      basemapId: 'cartoLight',
    });
  });

  it('should not connect when no token/user', () => {
    renderHook(() => useSimulationSocket());
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('should connect when token and user are set', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    expect(mockIo).toHaveBeenCalledOnce();
  });

  it('should register all expected event handlers', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    const events = mockSocket.on.mock.calls.map((c) => c[0]);
    expect(events).toContain('connect');
    expect(events).toContain('disconnect');
    expect(events).toContain('simulation:full-state');
    expect(events).toContain('simulation:delta');
    expect(events).toContain('routes:list');
    expect(events).toContain('simulation:list-updated');
  });

  it('connect event should set isConnected true and emit sync:request', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    const connectHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'connect')?.[1];
    connectHandler?.();
    expect(useSimulationStore.getState().isConnected).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('sync:request');
  });

  it('disconnect event should set isConnected false', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ isConnected: true } as any);
    renderHook(() => useSimulationSocket());
    const disconnectHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'disconnect')?.[1];
    disconnectHandler?.();
    expect(useSimulationStore.getState().isConnected).toBe(false);
  });

  it('simulation:full-state event should call setFullState', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    const fullStateHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'simulation:full-state')?.[1];
    const fullState: SimulationFullState = {
      vehicles: { v1: { id: 'v1', name: 'V1', lat: 4.6, lon: -74.1, speed: 50, color: '#f00', heading: 0, routeId: 'r1', waypointIndex: 0, status: 'moving' } },
      trafficLights: {},
      tick: 5,
      timestamp: Date.now(),
    };
    fullStateHandler?.(fullState);
    const s = useSimulationStore.getState();
    expect(s.vehicles['v1']).toBeDefined();
    expect(s.tick).toBe(5);
  });

  it('simulation:delta event should call applyDelta', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({
      vehicles: { v1: { id: 'v1', name: 'V1', lat: 4.6, lon: -74.1, speed: 30, color: '#f00', heading: 0, routeId: 'r1', waypointIndex: 0, status: 'moving' } },
      trafficLights: {},
      tick: 0,
    } as any);
    renderHook(() => useSimulationSocket());
    const deltaHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'simulation:delta')?.[1];
    const delta: SimulationDelta = {
      vehicles: { v1: { speed: 80 } },
      trafficLights: {},
      removed: [],
      tick: 6,
      timestamp: Date.now(),
    };
    deltaHandler?.(delta);
    expect(useSimulationStore.getState().vehicles['v1'].speed).toBe(80);
    expect(useSimulationStore.getState().tick).toBe(6);
  });

  it('routes:list event should call setRoutes', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    const routesHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'routes:list')?.[1];
    routesHandler?.([{ id: 'r1', name: 'Route 1' }]);
    expect(useSimulationStore.getState().routes).toEqual([{ id: 'r1', name: 'Route 1' }]);
  });

  it('simulation:list-updated should update simulation list', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    const listHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'simulation:list-updated')?.[1];
    const sims: SimulationSummary[] = [
      { simId: 's1', mapId: 'm1', nVehicles: 5, createdByUid: 'u1', createdByName: 'Alice', nodeId: 'n1', createdAt: 1000 },
    ];
    listHandler?.(sims);
    expect(useSimulationStore.getState().simulations).toEqual(sims);
  });

  it('simulation:list-updated should clear activeSimId if active sim removed', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'old-sim' } as any);
    renderHook(() => useSimulationSocket());
    const listHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'simulation:list-updated')?.[1];
    // Send list that does NOT include old-sim
    listHandler?.([{ simId: 'other', mapId: 'm1', nVehicles: 5, createdByUid: 'u1', createdByName: 'Alice', nodeId: 'n1', createdAt: 1000 }]);
    expect(useSimulationStore.getState().activeSimId).toBeNull();
  });

  it('simulation:list-updated should handle non-array gracefully', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    renderHook(() => useSimulationSocket());
    const listHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'simulation:list-updated')?.[1];
    listHandler?.(null);
    expect(useSimulationStore.getState().simulations).toEqual([]);
  });

  it('should disconnect and set isConnected false on unmount', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    const { unmount } = renderHook(() => useSimulationSocket());
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(useSimulationStore.getState().isConnected).toBe(false);
  });
});
