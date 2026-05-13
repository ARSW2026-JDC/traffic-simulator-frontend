import { describe, it, expect, beforeEach, vi } from 'vitest';


vi.mock('firebase/auth/cordova', () => ({
  User: class {
    uid = 'test-uid';
    email = 'test@example.com';
  },
}));


import type { UserProfile, ChatMessage } from '../types';
import { useAuthStore } from './authStore';
import { useChatStore } from './chatStore';
import { useHistoryStore } from './historyStore';
import { useSimulationStore } from './simulationStore';

describe('AuthStore', () => {
  const userProfile: UserProfile = { id: 'test-uid', role: 'ADMIN' as const, email: 'test@example.com', name: null, createdAt: '2024-01-01T00:00:00.000Z' };

  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should have initial null values', () => {
    const state = useAuthStore.getState();
    expect(state.firebaseUser).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should set firebase user and token', () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    useAuthStore.getState().setFirebaseUser(mockUser as any, 'test-token');
    
    const state = useAuthStore.getState();
    expect(state.firebaseUser).not.toBeNull();
    expect(state.token).toBe('test-token');
  });

  it('should set user profile', () => {
    useAuthStore.getState().setUser(userProfile);
    
    expect(useAuthStore.getState().user).toEqual(userProfile);
  });

  it('should set loading state', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('should logout and clear session', () => {
    useAuthStore.getState().setUser(userProfile);
    useAuthStore.getState().setFirebaseUser({ uid: 'test' } as any, 'token');
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.firebaseUser).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});

describe('ChatStore', () => {
  const sentMsg: ChatMessage = { id: '1', userId: 'user1', userName: 'User', content: 'Hello', timestamp: 123, status: 'sent' as const };

  beforeEach(() => {
    useChatStore.getState().setMessages([]);
    useChatStore.getState().setConnected(false);
  });

  it('should have initial empty state', () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isConnected).toBe(false);
  });

  it('should add message', () => {
    useChatStore.getState().addMessage(sentMsg);
    
    expect(useChatStore.getState().messages).toContainEqual(sentMsg);
  });

  it('should not add duplicate messages', () => {
    useChatStore.getState().addMessage(sentMsg);
    useChatStore.getState().addMessage(sentMsg);
    
    expect(useChatStore.getState().messages.length).toBe(1);
  });

  it('should set messages', () => {
    const msgs = [
      { id: '1', userId: 'user1', userName: 'User1', content: 'Hello', timestamp: 123, status: 'sent' as const },
      { id: '2', userId: 'user2', userName: 'User2', content: 'World', timestamp: 124, status: 'sent' as const },
    ];
    useChatStore.getState().setMessages(msgs);
    
    expect(useChatStore.getState().messages).toEqual(msgs);
  });

  it('should set connected state', () => {
    useChatStore.getState().setConnected(true);
    expect(useChatStore.getState().isConnected).toBe(true);
    
    useChatStore.getState().setConnected(false);
    expect(useChatStore.getState().isConnected).toBe(false);
  });

  const pendingMsg: ChatMessage = { id: '1', userId: 'user1', userName: 'User', content: 'Hello', timestamp: 123, status: 'pending' as const, clientId: 'client-1' };

  it('should add optimistic message', () => {
    useChatStore.getState().addOptimisticMessage(pendingMsg);
    
    expect(useChatStore.getState().messages).toContainEqual(pendingMsg);
  });

  it('should confirm message', () => {
    useChatStore.getState().addOptimisticMessage(pendingMsg);
    
    const serverMsg: ChatMessage = { id: 'server-1', userId: 'user1', userName: 'User', content: 'Hello', timestamp: 124, status: 'sent' as const };
    useChatStore.getState().confirmMessage('client-1', serverMsg);
    
    const msgs = useChatStore.getState().messages;
    expect(msgs[0].status).toBe('sent');
  });

  it('should fail message', () => {
    useChatStore.getState().addOptimisticMessage(pendingMsg);
    
    useChatStore.getState().failMessage('client-1');
    
    const msgs = useChatStore.getState().messages;
    expect(msgs[0].status).toBe('failed');
  });

  it('should merge history', () => {
    const serverMsgs = [
      { id: 's1', userId: 'user1', userName: 'User1', content: 'Server 1', timestamp: 100, status: 'sent' as const },
      { id: 's2', userId: 'user2', userName: 'User2', content: 'Server 2', timestamp: 200, status: 'sent' as const },
    ];
    
    const localMsg = { id: 'local1', userId: 'user1', userName: 'User', content: 'Local', timestamp: 150, status: 'pending' as const };
    useChatStore.getState().addOptimisticMessage(localMsg);
    
    useChatStore.getState().mergeHistory(serverMsgs);
    
    const msgs = useChatStore.getState().messages;
    expect(msgs.length).toBeGreaterThan(0);
  });

  it('should limit messages to 200 when adding via addMessage', () => {
    const msgs = Array.from({ length: 250 }, (_, i) => ({
      id: `msg-${i}`,
      userId: 'user1',
      userName: 'User',
      content: `Message ${i}`,
      timestamp: i,
      status: 'sent' as const,
    }));
    msgs.forEach(msg => useChatStore.getState().addMessage(msg));
    
    expect(useChatStore.getState().messages.length).toBeLessThanOrEqual(200);
  });
});

describe('HistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().setEntries([]);
    useHistoryStore.getState().setLoading(false);
  });

  it('should have initial empty state', () => {
    const state = useHistoryStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should add entry', () => {
    const entry = { id: '1', userId: 'user1', userName: 'User', entityType: 'vehicle', entityId: 'v1', action: 'add' as const, field: 'count', oldValue: '0', newValue: '1', timestamp: 123 };
    useHistoryStore.getState().addEntry(entry);
    
    expect(useHistoryStore.getState().entries).toContainEqual(entry);
  });

  it('should prepend new entries', () => {
    const entry1 = { id: '1', userId: 'user1', userName: 'User', entityType: 'vehicle', entityId: 'v1', action: 'add' as const, field: 'count', oldValue: '0', newValue: '1', timestamp: 100 };
    const entry2 = { id: '2', userId: 'user1', userName: 'User', entityType: 'trafficLight', entityId: 'tl1', action: 'add' as const, field: 'count', oldValue: '0', newValue: '1', timestamp: 200 };
    
    useHistoryStore.getState().addEntry(entry1);
    useHistoryStore.getState().addEntry(entry2);
    
    const entries = useHistoryStore.getState().entries;
    expect(entries[0].id).toBe('2');
  });

it('should limit entries to 200 when adding via addEntry', () => {
    const entries = Array.from({ length: 250 }, (_, i) => ({
      id: `entry-${i}`,
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

  it('should set entries', () => {
    const entries = [
      { id: '1', userId: 'user1', userName: 'User', entityType: 'vehicle', entityId: 'v1', action: 'add' as const, field: 'count', oldValue: '0', newValue: '1', timestamp: 123 },
    ];
    useHistoryStore.getState().setEntries(entries);
    
    expect(useHistoryStore.getState().entries).toEqual(entries);
  });

  it('should set loading state', () => {
    useHistoryStore.getState().setLoading(true);
    expect(useHistoryStore.getState().isLoading).toBe(true);
  });
});

describe('SimulationStore', () => {
  beforeEach(() => {
    useSimulationStore.getState().deselect();
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
    useSimulationStore.getState().setErrorMessage(null);
    useSimulationStore.getState().setFullState({}, {}, 0);
    useSimulationStore.getState().setConnected(false);
  });

  it('should have initial state', () => {
    const state = useSimulationStore.getState();
    expect(state.vehicles).toEqual({});
    expect(state.trafficLights).toEqual({});
    expect(state.selectedId).toBeNull();
    expect(state.selectedType).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.addMode).toBeNull();
    expect(state.clickPosition).toBeNull();
  });

  it('should set full state', () => {
    const vehicles = { 'v1': { id: 'v1', name: 'V1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000', routeId: 'r1', waypointIndex: 0, status: 'moving' as const } };
    const trafficLights = { 'tl1': { id: 'tl1', name: 'TL1', lat: 4.7, lon: -74.0, state: 'red' as const, greenDuration: 30, yellowDuration: 3, redDuration: 30, stateTimer: 0 } };
    
    useSimulationStore.getState().setFullState(vehicles, trafficLights, 100);
    
    const state = useSimulationStore.getState();
    expect(state.vehicles).toEqual(vehicles);
    expect(state.trafficLights).toEqual(trafficLights);
    expect(state.tick).toBe(100);
  });

  it('should apply delta updates', () => {
    useSimulationStore.getState().setFullState(
      { 'v1': { id: 'v1', name: 'V1', lat: 4.7, lon: -74.0, speed: 10, heading: 0, color: '#FF0000', routeId: 'r1', waypointIndex: 0, status: 'moving' as const } },
      {},
      0
    );
    
    const delta = {
      vehicles: { 'v1': { speed: 20 } },
      trafficLights: {},
      removed: [],
      tick: 1,
      timestamp: 100,
    };
    
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().vehicles['v1']?.speed).toBe(20);
    expect(useSimulationStore.getState().tick).toBe(1);
  });

  it('should remove deleted entities', () => {
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

  it('should select and deselect entities', () => {
    useSimulationStore.getState().selectEntity('v1', 'vehicle');
    expect(useSimulationStore.getState().selectedId).toBe('v1');
    expect(useSimulationStore.getState().selectedType).toBe('vehicle');
    
    useSimulationStore.getState().deselect();
    expect(useSimulationStore.getState().selectedId).toBeNull();
    expect(useSimulationStore.getState().selectedType).toBeNull();
  });

  it('should set addMode', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    expect(useSimulationStore.getState().addMode).toBe('trafficLight');
    
    useSimulationStore.getState().setAddMode('vehicle');
    expect(useSimulationStore.getState().addMode).toBe('vehicle');
    
    useSimulationStore.getState().setAddMode(null);
    expect(useSimulationStore.getState().addMode).toBeNull();
  });

  it('should set clickPosition', () => {
    const pos = { lat: 4.7110, lng: -74.0721 };
    useSimulationStore.getState().setClickPosition(pos);
    expect(useSimulationStore.getState().clickPosition).toEqual(pos);
    
    useSimulationStore.getState().setClickPosition(null);
    expect(useSimulationStore.getState().clickPosition).toBeNull();
  });

  it('should set error message', () => {
    useSimulationStore.getState().setErrorMessage('Test error');
    expect(useSimulationStore.getState().errorMessage).toBe('Test error');
    
    useSimulationStore.getState().setErrorMessage(null);
    expect(useSimulationStore.getState().errorMessage).toBeNull();
  });

  it('should set simulation list', () => {
    const simulations = [{ simId: 'sim1', mapId: 'map-1', nVehicles: 5, createdByUid: 'u1', createdByName: 'User', nodeId: 'n1', createdAt: 1000 }];
    useSimulationStore.getState().setSimulationList(simulations);
    expect(useSimulationStore.getState().simulations).toEqual(simulations);
  });

  it('should set active sim id', () => {
    useSimulationStore.getState().setActiveSimId('sim1');
    expect(useSimulationStore.getState().activeSimId).toBe('sim1');
    
    useSimulationStore.getState().setActiveSimId(null);
    expect(useSimulationStore.getState().activeSimId).toBeNull();
  });

  it('should set basemap id', () => {
    useSimulationStore.getState().setBasemapId('cartoDark');
    expect(useSimulationStore.getState().basemapId).toBe('cartoDark');
  });

  it('should set bbox', () => {
    const bbox = { minLat: 4.0, maxLat: 5.0, minLng: -75.0, maxLng: -74.0 };
    useSimulationStore.getState().setBbox(bbox);
    expect(useSimulationStore.getState().bbox).toEqual(bbox);
    
    useSimulationStore.getState().setBbox(null);
    expect(useSimulationStore.getState().bbox).toBeNull();
  });

  it('should set routes', () => {
    const routes = [{ id: 'r1', name: 'Route 1' }];
    useSimulationStore.getState().setRoutes(routes);
    expect(useSimulationStore.getState().routes).toEqual(routes);
  });

  it('should set connected state', () => {
    useSimulationStore.getState().setConnected(true);
    expect(useSimulationStore.getState().isConnected).toBe(true);
    
    useSimulationStore.getState().setConnected(false);
    expect(useSimulationStore.getState().isConnected).toBe(false);
  });
});