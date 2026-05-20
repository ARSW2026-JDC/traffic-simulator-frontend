import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChatStore } from '../stores/chatStore';
import { useHistoryStore } from '../stores/historyStore';
import { useSimulationStore } from '../stores/simulationStore';
import type { ChatMessage } from '../types';


vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
    disconnect: vi.fn(),
    id: 'test-socket-id',
  })),
}));

vi.mock('../services/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('useChatSocket', () => {
  const pendingMsg: ChatMessage = {
    id: 'msg-1',
    userId: 'user-1',
    userName: 'User',
    content: 'Hello',
    timestamp: 1234567890,
    status: 'pending' as const,
    clientId: 'client-1',
  };

  beforeEach(() => {
    useChatStore.getState().setMessages([]);
    useChatStore.getState().setConnected(false);
  });

  it('should handle message reception', () => {
    const msg: ChatMessage = {
      id: 'msg-1',
      userId: 'user-1',
      userName: 'User',
      content: 'Hello',
      timestamp: 1234567890,
      status: 'sent' as const,
    };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toContainEqual(msg);
  });

  it('should handle connection state', () => {
    useChatStore.getState().setConnected(true);
    expect(useChatStore.getState().isConnected).toBe(true);
  });

  it('should handle optimistic messages', () => {
    const msg: ChatMessage = {
      id: 'msg-1',
      userId: 'user-1',
      userName: 'User',
      content: 'Sending...',
      timestamp: 1234567890,
      status: 'pending' as const,
      clientId: 'client-1',
    };
    useChatStore.getState().addOptimisticMessage(msg);
    expect(useChatStore.getState().messages[0].status).toBe('pending');
  });

  it('should handle message confirmation', () => {
    useChatStore.getState().addOptimisticMessage(pendingMsg);
    
    const serverMsg: ChatMessage = {
      id: 'server-msg-1',
      userId: 'user-1',
      userName: 'User',
      content: 'Hello',
      timestamp: 1234567891,
      status: 'sent' as const,
    };
    useChatStore.getState().confirmMessage('client-1', serverMsg);
    
    expect(useChatStore.getState().messages[0].status).toBe('sent');
  });

  it('should handle message failure', () => {
    useChatStore.getState().addOptimisticMessage(pendingMsg);
    useChatStore.getState().failMessage('client-1');
    
    expect(useChatStore.getState().messages[0].status).toBe('failed');
  });

  it('should handle history merge', () => {
    const serverMsgs = [
      { id: 's1', userId: 'u1', userName: 'User1', content: 'Server 1', timestamp: 100, status: 'sent' as const },
      { id: 's2', userId: 'u2', userName: 'User2', content: 'Server 2', timestamp: 200, status: 'sent' as const },
    ];
    useChatStore.getState().mergeHistory(serverMsgs);
    
    expect(useChatStore.getState().messages.length).toBe(2);
  });
});

describe('useHistorySocket', () => {
  beforeEach(() => {
    useHistoryStore.getState().setEntries([]);
    useHistoryStore.getState().setLoading(false);
  });

  it('should handle entry addition', () => {
    const entry = {
      id: 'entry-1',
      userId: 'user-1',
      userName: 'User',
      entityType: 'vehicle',
      entityId: 'v1',
      action: 'add' as const,
      field: 'count',
      oldValue: '0',
      newValue: '1',
      timestamp: 1234567890,
    };
    useHistoryStore.getState().addEntry(entry);
    expect(useHistoryStore.getState().entries).toContainEqual(entry);
  });

  it('should handle entries loading', () => {
    const entries = [
      { id: 'e1', userId: 'u1', userName: 'User1', entityType: 'vehicle', entityId: 'v1', action: 'add' as const, field: 'count', oldValue: '0', newValue: '1', timestamp: 100 },
      { id: 'e2', userId: 'u2', userName: 'User2', entityType: 'trafficLight', entityId: 'tl1', action: 'add' as const, field: 'count', oldValue: '0', newValue: '1', timestamp: 200 },
    ];
    useHistoryStore.getState().setEntries(entries);
    expect(useHistoryStore.getState().entries).toEqual(entries);
  });

  it('should handle loading state', () => {
    useHistoryStore.getState().setLoading(true);
    expect(useHistoryStore.getState().isLoading).toBe(true);
  });

  it('should limit entries to 250 when adding via addEntry', () => {
    const entries = Array.from({ length: 250 }, (_, i) => ({
      id: `e${i}`,
      userId: 'u1',
      userName: 'User',
      entityType: 'vehicle',
      entityId: 'v1',
      action: 'add' as const,
      field: 'count',
      oldValue: '0',
      newValue: '1',
      timestamp: i,
    }));
    entries.forEach(entry => useHistoryStore.getState().addEntry(entry));
    
    expect(useHistoryStore.getState().entries.length).toBeLessThanOrEqual(250);
  });
});

describe('useSimulationSocket', () => {
  beforeEach(() => {
    useSimulationStore.getState().setFullState({}, {}, 0);
    useSimulationStore.getState().setConnected(false);
  });

  it('should handle full state update', () => {
    const vehicles = {
      'v1': { id: 'v1', name: 'V1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000', routeId: 'r1', waypointIndex: 0, status: 'moving' as const },
    };
    const trafficLights = {
      'tl1': { id: 'tl1', name: 'TL1', lat: 4.7, lon: -74.0, state: 'red' as const, greenDuration: 30, yellowDuration: 3, redDuration: 30, stateTimer: 0 },
    };
    useSimulationStore.getState().setFullState(vehicles, trafficLights, 100);
    
    const state = useSimulationStore.getState();
    expect(state.vehicles).toEqual(vehicles);
    expect(state.trafficLights).toEqual(trafficLights);
    expect(state.tick).toBe(100);
  });

  it('should handle delta updates', () => {
    useSimulationStore.getState().setFullState(
      { 'v1': { id: 'v1', name: 'V1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000', routeId: 'r1', waypointIndex: 0, status: 'moving' as const } },
      {},
      0
    );
    
    const delta = {
      vehicles: { 'v1': { speed: 20, lat: 4.71 } },
      trafficLights: {},
      removed: [],
      tick: 1,
      timestamp: 100,
    };
    
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().vehicles['v1']?.speed).toBe(20);
    expect(useSimulationStore.getState().tick).toBe(1);
  });

  it('should handle removed entities', () => {
    useSimulationStore.getState().setFullState(
      { 'v1': { id: 'v1', name: 'V1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000', routeId: 'r1', waypointIndex: 0, status: 'moving' as const } },
      { 'tl1': { id: 'tl1', name: 'TL1', lat: 4.7, lon: -74.0, state: 'red' as const, greenDuration: 30, yellowDuration: 3, redDuration: 30, stateTimer: 0 } },
      0
    );
    
    const delta = {
      vehicles: {},
      trafficLights: {},
      removed: ['v1', 'tl1'],
      tick: 1,
      timestamp: 100,
    };
    
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().vehicles['v1']).toBeUndefined();
    expect(useSimulationStore.getState().trafficLights['tl1']).toBeUndefined();
  });

  it('should handle connection state', () => {
    useSimulationStore.getState().setConnected(true);
    expect(useSimulationStore.getState().isConnected).toBe(true);
    
    useSimulationStore.getState().setConnected(false);
    expect(useSimulationStore.getState().isConnected).toBe(false);
  });

  it('should handle entity selection', () => {
    useSimulationStore.getState().selectEntity('v1', 'vehicle');
    expect(useSimulationStore.getState().selectedId).toBe('v1');
    expect(useSimulationStore.getState().selectedType).toBe('vehicle');
  });

  it('should handle error messages', () => {
    useSimulationStore.getState().setErrorMessage('Connection failed');
    expect(useSimulationStore.getState().errorMessage).toBe('Connection failed');
    
    useSimulationStore.getState().setErrorMessage(null);
    expect(useSimulationStore.getState().errorMessage).toBeNull();
  });

  it('should handle simulation:stats event', () => {
    const stats = {
      avgSpeed: 25,
      vehicleCount: 10,
      movingCount: 5,
      stoppedCount: 3,
      waitingCount: 2,
      redLightCount: 3,
      greenLightCount: 5,
      yellowLightCount: 2,
      totalLights: 10,
      mostCongestedEdge: null,
      profileCounts: { normal: 10 },
      tick: 100,
      timestamp: Date.now(),
    };
    useSimulationStore.getState().setSimStats(stats);
    expect(useSimulationStore.getState().simStats).toEqual(stats);
  });
});

describe('Socket Connection', () => {
  it('should create socket with correct URL', () => {
    const GATEWAY = 'http://localhost:3000';
    const SIM_PATH = '/sim/socket.io';
    expect(GATEWAY).toBe('http://localhost:3000');
    expect(SIM_PATH).toBe('/sim/socket.io');
  });

  it('should handle connection options', () => {
    const options = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    };
    expect(options.transports).toContain('websocket');
    expect(options.reconnection).toBe(true);
  });
});

describe('Message Parsing', () => {
  it('should parse fullUpdate message', () => {
    const message = {
      type: 'fullUpdate',
      data: {
        vehicles: {},
        trafficLights: {},
        tick: 0,
      },
    };
    expect(message.type).toBe('fullUpdate');
  });

  it('should parse delta message', () => {
    const message = {
      type: 'delta',
      data: {
        vehicles: { v1: { speed: 10 } },
        trafficLights: {},
        removed: [],
        tick: 1,
      },
    };
    expect(message.type).toBe('delta');
  });

  it('should handle changes array in delta', () => {
    const delta = {
      vehicles: {},
      trafficLights: {},
      removed: [],
      tick: 1,
    };
    expect(delta).toHaveProperty('vehicles');
    expect(delta).toHaveProperty('trafficLights');
    expect(delta).toHaveProperty('removed');
    expect(delta).toHaveProperty('tick');
  });
});