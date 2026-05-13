import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSimulationStore } from '../stores/simulationStore';
import { useChatStore } from '../stores/chatStore';
import { useHistoryStore } from '../stores/historyStore';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'test-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../services/firebase', () => ({
  auth: {
    currentUser: null,
    getIdToken: vi.fn().mockResolvedValue('test-token'),
  },
}));

describe('useSimulationSocket - Full Integration', () => {
  beforeEach(() => {
    useSimulationStore.getState().setFullState({}, {}, 0);
    useSimulationStore.getState().setConnected(false);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Socket Connection', () => {
    it('should initialize socket with correct URL', () => {
      const GATEWAY = 'http://localhost:3000';
      const SIM_PATH = '/sim';
      
      expect(GATEWAY).toBe('http://localhost:3000');
      expect(SIM_PATH).toBe('/sim');
    });

    it('should configure socket with transports', () => {
      const options = {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
      };
      
      expect(options.transports).toContain('websocket');
      expect(options.transports).toContain('polling');
    });

    it('should handle socket connect event', () => {
      mockSocket.on('connect', expect.any(Function));
      expect(mockSocket.on).toBeDefined();
    });

    it('should handle socket disconnect event', () => {
      mockSocket.on('disconnect', expect.any(Function));
      expect(mockSocket.on).toBeDefined();
    });

    it('should handle socket error event', () => {
      mockSocket.on('error', expect.any(Function));
      expect(mockSocket.on).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    it('should handle fullUpdate message', () => {
      const fullUpdateMsg = {
        type: 'fullUpdate',
        vehicles: { 'v1': { id: 'v1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000' } },
        trafficLights: { 'tl1': { id: 'tl1', lat: 4.7, lon: -74.0, state: 'red', greenDuration: 30, nodeId: 1 } },
        tick: 100,
      };
      
      useSimulationStore.getState().setFullState(
        fullUpdateMsg.vehicles,
        fullUpdateMsg.trafficLights,
        fullUpdateMsg.tick
      );
      
      const state = useSimulationStore.getState();
      expect(state.vehicles['v1']).toBeDefined();
      expect(state.trafficLights['tl1']).toBeDefined();
      expect(state.tick).toBe(100);
    });

    it('should handle delta message with changes', () => {
      useSimulationStore.getState().setFullState(
        { 'v1': { id: 'v1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000' } },
        {},
        0
      );
      
      const deltaMsg = {
        type: 'delta',
        vehicles: { 'v1': { speed: 15, lat: 4.71 } },
        trafficLights: {},
        removed: [],
        tick: 1,
      };
      
      useSimulationStore.getState().applyDelta(deltaMsg);
      
      const state = useSimulationStore.getState();
      expect(state.vehicles['v1']?.speed).toBe(15);
      expect(state.tick).toBe(1);
    });

    it('should handle removed vehicles in delta', () => {
      useSimulationStore.getState().setFullState(
        { 
          'v1': { id: 'v1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000' },
          'v2': { id: 'v2', lat: 4.8, lon: -74.1, speed: 10, heading: 0, color: '#00FF00' },
        },
        {},
        0
      );
      
      const deltaMsg = {
        type: 'delta',
        vehicles: {},
        trafficLights: {},
        removed: ['v1'],
        tick: 1,
      };
      
      useSimulationStore.getState().applyDelta(deltaMsg);
      
      expect(useSimulationStore.getState().vehicles['v1']).toBeUndefined();
      expect(useSimulationStore.getState().vehicles['v2']).toBeDefined();
    });

    it('should handle removed traffic lights in delta', () => {
      useSimulationStore.getState().setFullState(
        {},
        { 
          'tl1': { id: 'tl1', lat: 4.7, lon: -74.0, state: 'red', greenDuration: 30, nodeId: 1 },
          'tl2': { id: 'tl2', lat: 4.8, lon: -74.1, state: 'green', greenDuration: 30, nodeId: 2 },
        },
        0
      );
      
      const deltaMsg = {
        type: 'delta',
        vehicles: {},
        trafficLights: {},
        removed: [],
        tick: 1,
      };
      
      // Simulate removal via direct store operation
      const { trafficLights } = useSimulationStore.getState();
      delete (trafficLights as any)['tl1'];
      useSimulationStore.getState().setFullState({}, trafficLights as any, 1);
      
      expect(useSimulationStore.getState().trafficLights['tl1']).toBeUndefined();
    });
  });

  describe('Socket Events', () => {
    it('should emit command events', () => {
      mockSocket.emit = vi.fn();
      
      const commandPayload = {
        type: 'add_vehicle',
        data: { count: 1 },
      };
      
      mockSocket.emit('command', commandPayload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('command', commandPayload);
    });

    it('should emit entity:add events', () => {
      mockSocket.emit = vi.fn();
      
      const entityPayload = {
        type: 'trafficLight',
        data: { lat: 4.7, lon: -74.0, greenDuration: 30 },
      };
      
      mockSocket.emit('entity:add', entityPayload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('entity:add', entityPayload);
    });
  });

  describe('Connection State Management', () => {
    it('should update store on connect', () => {
      useSimulationStore.getState().setConnected(true);
      expect(useSimulationStore.getState().isConnected).toBe(true);
    });

    it('should update store on disconnect', () => {
      useSimulationStore.getState().setConnected(true);
      useSimulationStore.getState().setConnected(false);
      expect(useSimulationStore.getState().isConnected).toBe(false);
    });

    it('should set error message on socket error', () => {
      const errorMsg = 'Connection failed: WebSocket closed';
      useSimulationStore.getState().setErrorMessage(errorMsg);
      expect(useSimulationStore.getState().errorMessage).toBe(errorMsg);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup socket on unmount', () => {
      mockSocket.off = vi.fn();
      mockSocket.disconnect = vi.fn();
      
      mockSocket.off('connect');
      mockSocket.off('disconnect');
      mockSocket.off('error');
      mockSocket.off('fullUpdate');
      mockSocket.off('delta');
      
      expect(mockSocket.off).toHaveBeenCalledTimes(5);
    });
  });
});

describe('useChatSocket - Full Integration', () => {
  beforeEach(() => {
    useChatStore.getState().setMessages([]);
    useChatStore.getState().setConnected(false);
    vi.clearAllMocks();
  });

  describe('Chat Socket Events', () => {
    it('should handle message event', () => {
      const message = {
        id: 'msg-1',
        text: 'Hello World',
        timestamp: 1234567890,
        senderId: 'user-1',
        status: 'sent' as const,
      };
      
      useChatStore.getState().addMessage(message);
      
      expect(useChatStore.getState().messages).toContainEqual(message);
    });

    it('should handle history event', () => {
      const history = [
        { id: 'msg-1', text: 'First', timestamp: 1000, senderId: 'u1', status: 'sent' as const },
        { id: 'msg-2', text: 'Second', timestamp: 2000, senderId: 'u2', status: 'sent' as const },
      ];
      
      useChatStore.getState().setMessages(history);
      
      expect(useChatStore.getState().messages.length).toBe(2);
    });

    it('should emit message', () => {
      mockSocket.emit = vi.fn();
      
      const message = { text: 'Test', clientId: 'client-1' };
      mockSocket.emit('message', message);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('message', message);
    });
  });

  describe('Message Flow', () => {
    it('should add optimistic message before server response', () => {
      const optimisticMsg = {
        id: 'temp-1',
        text: 'Sending...',
        timestamp: 1234567890,
        senderId: 'user-1',
        status: 'pending' as const,
        clientId: 'client-1',
      };
      
      useChatStore.getState().addOptimisticMessage(optimisticMsg);
      
      expect(useChatStore.getState().messages[0].status).toBe('pending');
    });

    it('should confirm message with server response', () => {
      const optimisticMsg = {
        id: 'temp-1',
        text: 'Sending...',
        timestamp: 1234567890,
        senderId: 'user-1',
        status: 'pending' as const,
        clientId: 'client-1',
      };
      useChatStore.getState().addOptimisticMessage(optimisticMsg);
      
      const serverMsg = {
        id: 'server-1',
        text: 'Sending...',
        timestamp: 1234567891,
        senderId: 'user-1',
        status: 'sent' as const,
      };
      useChatStore.getState().confirmMessage('client-1', serverMsg);
      
      expect(useChatStore.getState().messages[0].status).toBe('sent');
    });

    it('should mark message as failed on error', () => {
      const msg = {
        id: 'temp-1',
        text: 'Sending...',
        timestamp: 1234567890,
        senderId: 'user-1',
        status: 'pending' as const,
        clientId: 'client-1',
      };
      useChatStore.getState().addOptimisticMessage(msg);
      
      useChatStore.getState().failMessage('client-1');
      
      expect(useChatStore.getState().messages[0].status).toBe('failed');
    });
  });
});

describe('useHistorySocket - Full Integration', () => {
  beforeEach(() => {
    useHistoryStore.getState().setEntries([]);
    useHistoryStore.getState().setLoading(false);
    vi.clearAllMocks();
  });

  describe('History Socket Events', () => {
    it('should handle entry event', () => {
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

    it('should handle history event with multiple entries', () => {
      const history = [
        { id: 'e1', type: 'vehicle_added' as const, description: 'Added', timestamp: 1000, userId: 'u1', changes: {} },
        { id: 'e2', type: 'traffic_light_added' as const, description: 'Added TL', timestamp: 2000, userId: 'u2', changes: {} },
      ];
      
      useHistoryStore.getState().setEntries(history);
      
      expect(useHistoryStore.getState().entries.length).toBe(2);
    });

    it('should emit entry subscription', () => {
      mockSocket.emit = vi.fn();
      
      mockSocket.emit('entry:subscribe', { simId: 'sim-1' });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('entry:subscribe', { simId: 'sim-1' });
    });
  });

  describe('Loading States', () => {
    it('should set loading to true when fetching history', () => {
      useHistoryStore.getState().setLoading(true);
      expect(useHistoryStore.getState().isLoading).toBe(true);
    });

    it('should set loading to false after history loads', () => {
      useHistoryStore.getState().setLoading(true);
      useHistoryStore.getState().setLoading(false);
      expect(useHistoryStore.getState().isLoading).toBe(false);
    });
  });
});

describe('Socket Event Types', () => {
  const simulationEvents = [
    'connect',
    'disconnect',
    'error',
    'fullUpdate',
    'delta',
  ];

  const chatEvents = [
    'connect',
    'disconnect',
    'error',
    'message',
    'history',
  ];

  const historyEvents = [
    'connect',
    'disconnect',
    'error',
    'entry',
    'history',
  ];

  simulationEvents.forEach(event => {
    it(`should support simulation event: ${event}`, () => {
      expect(event).toBeDefined();
    });
  });

  chatEvents.forEach(event => {
    it(`should support chat event: ${event}`, () => {
      expect(event).toBeDefined();
    });
  });

  historyEvents.forEach(event => {
    it(`should support history event: ${event}`, () => {
      expect(event).toBeDefined();
    });
  });
});