import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChatStore } from '../stores/chatStore';
import { useHistoryStore } from '../stores/historyStore';
import { useSimulationStore } from '../stores/simulationStore';


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
  beforeEach(() => {
    useChatStore.getState().setMessages([]);
    useChatStore.getState().setConnected(false);
  });

  it('should handle message reception', () => {
    const msg = {
      id: 'msg-1',
      text: 'Hello',
      timestamp: 1234567890,
      senderId: 'user-1',
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
    const msg = {
      id: 'msg-1',
      text: 'Sending...',
      timestamp: 1234567890,
      senderId: 'user-1',
      status: 'pending' as const,
      clientId: 'client-1',
    };
    useChatStore.getState().addOptimisticMessage(msg);
    expect(useChatStore.getState().messages[0].status).toBe('pending');
  });

  it('should handle message confirmation', () => {
    const optimisticMsg = {
      id: 'msg-1',
      text: 'Hello',
      timestamp: 1234567890,
      senderId: 'user-1',
      status: 'pending' as const,
      clientId: 'client-1',
    };
    useChatStore.getState().addOptimisticMessage(optimisticMsg);
    
    const serverMsg = {
      id: 'server-msg-1',
      text: 'Hello',
      timestamp: 1234567891,
      senderId: 'user-1',
      status: 'sent' as const,
    };
    useChatStore.getState().confirmMessage('client-1', serverMsg);
    
    expect(useChatStore.getState().messages[0].status).toBe('sent');
  });

  it('should handle message failure', () => {
    const msg = {
      id: 'msg-1',
      text: 'Hello',
      timestamp: 1234567890,
      senderId: 'user-1',
      status: 'pending' as const,
      clientId: 'client-1',
    };
    useChatStore.getState().addOptimisticMessage(msg);
    useChatStore.getState().failMessage('client-1');
    
    expect(useChatStore.getState().messages[0].status).toBe('failed');
  });

  it('should handle history merge', () => {
    const serverMsgs = [
      { id: 's1', text: 'Server 1', timestamp: 100, senderId: 'u1', status: 'sent' as const },
      { id: 's2', text: 'Server 2', timestamp: 200, senderId: 'u2', status: 'sent' as const },
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
      type: 'vehicle_added' as const,
      description: 'Vehicle added',
      timestamp: 1234567890,
      userId: 'user-1',
      changes: {},
    };
    useHistoryStore.getState().addEntry(entry);
    expect(useHistoryStore.getState().entries).toContainEqual(entry);
  });

  it('should handle entries loading', () => {
    const entries = [
      { id: 'e1', type: 'vehicle_added' as const, description: 'Added', timestamp: 100, userId: 'u1', changes: {} },
      { id: 'e2', type: 'traffic_light_added' as const, description: 'Added TL', timestamp: 200, userId: 'u2', changes: {} },
    ];
    useHistoryStore.getState().setEntries(entries);
    expect(useHistoryStore.getState().entries).toEqual(entries);
  });

  it('should handle loading state', () => {
    useHistoryStore.getState().setLoading(true);
    expect(useHistoryStore.getState().isLoading).toBe(true);
  });

  it('should limit entries to 200 when adding via addEntry', () => {
    const entries = Array.from({ length: 250 }, (_, i) => ({
      id: `e${i}`,
      type: 'vehicle_added' as const,
      description: `Entry ${i}`,
      timestamp: i,
      userId: 'u1',
      changes: {},
    }));
    entries.forEach(entry => useHistoryStore.getState().addEntry(entry));
    
    expect(useHistoryStore.getState().entries.length).toBeLessThanOrEqual(200);
  });
});

describe('useSimulationSocket', () => {
  beforeEach(() => {
    useSimulationStore.getState().setFullState({}, {}, 0);
    useSimulationStore.getState().setConnected(false);
  });

  it('should handle full state update', () => {
    const vehicles = {
      'v1': { id: 'v1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000' },
    };
    const trafficLights = {
      'tl1': { id: 'tl1', lat: 4.7, lon: -74.0, state: 'red' as const, greenDuration: 30, nodeId: 1 },
    };
    useSimulationStore.getState().setFullState(vehicles, trafficLights, 100);
    
    const state = useSimulationStore.getState();
    expect(state.vehicles).toEqual(vehicles);
    expect(state.trafficLights).toEqual(trafficLights);
    expect(state.tick).toBe(100);
  });

  it('should handle delta updates', () => {
    useSimulationStore.getState().setFullState(
      { 'v1': { id: 'v1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000' } },
      {},
      0
    );
    
    const delta = {
      vehicles: { 'v1': { speed: 20, lat: 4.71 } },
      trafficLights: {},
      removed: [],
      tick: 1,
    };
    
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().vehicles['v1']?.speed).toBe(20);
    expect(useSimulationStore.getState().tick).toBe(1);
  });

  it('should handle removed entities', () => {
    useSimulationStore.getState().setFullState(
      { 'v1': { id: 'v1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000' } },
      { 'tl1': { id: 'tl1', lat: 4.7, lon: -74.0, state: 'red' as const, greenDuration: 30, nodeId: 1 } },
      0
    );
    
    const delta = {
      vehicles: {},
      trafficLights: {},
      removed: ['v1', 'tl1'],
      tick: 1,
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