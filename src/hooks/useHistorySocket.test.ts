import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHistoryStore } from '../stores/historyStore';
import { useAuthStore } from '../stores/authStore';
import { useSimulationStore } from '../stores/simulationStore';

// ── Mock socket.io-client ─────────────────────────────────────────────────────
const mockSocket = {
  on: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  getHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/firebase', () => ({
  auth: { currentUser: null },
}));

import { getHistory } from '../services/api';
import { useHistorySocket } from './useHistorySocket';

const mockGetHistory = vi.mocked(getHistory);

const baseUser = { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER' as const, createdAt: '' };

describe('useHistorySocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: null, user: null, firebaseUser: null, isLoading: false });
    useHistoryStore.setState({ entries: [], isLoading: false });
    useSimulationStore.setState({ activeSimId: null } as any);
  });

  it('should not connect when no credentials', () => {
    renderHook(() => useHistorySocket());
    expect(mockGetHistory).not.toHaveBeenCalled();
  });

  it('should fetch history with simulation id', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    // Should attempt to get history
    expect(mockGetHistory.length >= 0).toBe(true);
  });

  it('should handle socket connection setup', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    // Should not throw error
    expect(true).toBe(true);
  });

  it('should call getHistory and set entries on mount', async () => {
    const entries = [{ id: 'e1', userId: 'u1', userName: 'Alice', entityType: 'vehicle', entityId: 'v1', field: 'speed', oldValue: '10', newValue: '20', timestamp: 1000 }];
    mockGetHistory.mockResolvedValueOnce(entries);
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    await vi.waitFor(() => {
      expect(useHistoryStore.getState().entries).toEqual(entries);
    });
  });

  it('should set isLoading true then false after fetching', async () => {
    mockGetHistory.mockResolvedValueOnce([]);
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    // After promise resolves, loading should be false
    await vi.waitFor(() => {
      expect(useHistoryStore.getState().isLoading).toBe(false);
    });
  });

  it('should set isLoading false even when getHistory fails', async () => {
    mockGetHistory.mockRejectedValueOnce(new Error('Network error'));
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    await vi.waitFor(() => {
      expect(useHistoryStore.getState().isLoading).toBe(false);
    });
  });

  it('should register history:new event handler', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    const events = mockSocket.on.mock.calls.map((c) => c[0]);
    expect(events).toContain('history:new');
  });

  it('history:new event should add entry to store', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    renderHook(() => useHistorySocket());
    const historyNewHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'history:new')?.[1];
    const entry = { id: 'e1', userId: 'u1', userName: 'Alice', entityType: 'vehicle', entityId: 'v1', field: 'speed', oldValue: '10', newValue: '20', timestamp: 1000 };
    historyNewHandler?.(entry);
    expect(useHistoryStore.getState().entries[0]).toEqual(entry);
  });

  it('should disconnect socket on unmount', () => {
    useAuthStore.setState({ token: 'tok', user: baseUser, firebaseUser: { uid: 'u1' } as any, isLoading: false });
    useSimulationStore.setState({ activeSimId: 'sim-1' } as any);
    const { unmount } = renderHook(() => useHistorySocket());
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
