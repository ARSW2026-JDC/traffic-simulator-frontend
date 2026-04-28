import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { io } from 'socket.io-client';

// ── Mock socket.io-client ─────────────────────────────────────────────────────
const mockSocket = {
  on: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
};
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));
const mockIo = vi.mocked(io);

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  getChatMessages: vi.fn().mockResolvedValue([]),
}));

// ── Mock firebase (already in setup, but explicit here for the auth import) ──
vi.mock('../services/firebase', () => ({
  auth: { currentUser: null },
}));

import { useChatSocket } from './useChatSocket';

describe('useChatSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({ messages: [], isConnected: false });
    useAuthStore.setState({ token: null, user: null, firebaseUser: null, isLoading: false });
  });

  it('should not connect socket when token/user are absent', () => {
    renderHook(() => useChatSocket());
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('should connect socket when token and user are present', async () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    renderHook(() => useChatSocket());
    expect(mockIo).toHaveBeenCalledOnce();
  });

  it('should register socket event handlers', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    renderHook(() => useChatSocket());
    const events = mockSocket.on.mock.calls.map((c) => c[0]);
    expect(events).toContain('connect');
    expect(events).toContain('disconnect');
    expect(events).toContain('message:new');
  });

  it('should call disconnect on cleanup', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    const { unmount } = renderHook(() => useChatSocket());
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('connect event should call setConnected(true)', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    renderHook(() => useChatSocket());
    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'connect')?.[1];
    connectHandler?.();
    expect(useChatStore.getState().isConnected).toBe(true);
  });

  it('disconnect event should call setConnected(false)', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    useChatStore.setState({ isConnected: true });
    renderHook(() => useChatSocket());
    const disconnectHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'disconnect')?.[1];
    disconnectHandler?.();
    expect(useChatStore.getState().isConnected).toBe(false);
  });

  it('message:new event with clientId should confirm the message', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    // Seed an optimistic message
    useChatStore.setState({
      messages: [
        { id: 'tmp', clientId: 'cli-1', userId: 'u1', userName: 'Alice', content: 'hi', timestamp: 1, status: 'pending' },
      ],
    });
    renderHook(() => useChatSocket());
    const msgHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'message:new')?.[1];
    msgHandler?.({ id: 'srv-1', clientId: 'cli-1', userId: 'u1', userName: 'Alice', content: 'hi', timestamp: 1 });
    expect(useChatStore.getState().messages[0].id).toBe('srv-1');
    expect(useChatStore.getState().messages[0].status).toBe('sent');
  });

  it('message:new event without clientId should add the message', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'USER', createdAt: '' },
      firebaseUser: { uid: 'u1' } as any,
      isLoading: false,
    });
    renderHook(() => useChatSocket());
    const msgHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'message:new')?.[1];
    msgHandler?.({ id: 'new-1', userId: 'u2', userName: 'Bob', content: 'Hey', timestamp: 2 });
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].id).toBe('new-1');
  });
});
