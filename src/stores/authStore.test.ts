import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { UserProfile } from '../types';

const mockUser: UserProfile = {
  id: 'uid-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  role: 'USER',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      firebaseUser: null,
      token: null,
      user: null,
      isLoading: true,
    });
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.firebaseUser).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('setFirebaseUser should set firebaseUser and token', () => {
    const fakeUser = { uid: 'firebase-uid' } as any;
    useAuthStore.getState().setFirebaseUser(fakeUser, 'my-token');
    const state = useAuthStore.getState();
    expect(state.firebaseUser).toEqual(fakeUser);
    expect(state.token).toBe('my-token');
  });

  it('setFirebaseUser should accept null values', () => {
    useAuthStore.getState().setFirebaseUser(null, null);
    const state = useAuthStore.getState();
    expect(state.firebaseUser).toBeNull();
    expect(state.token).toBeNull();
  });

  it('setUser should update user profile', () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setUser should accept null to clear user', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setLoading should update isLoading flag', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('logout should clear firebaseUser, token, and user', () => {
    useAuthStore.setState({
      firebaseUser: { uid: 'abc' } as any,
      token: 'tok',
      user: mockUser,
      isLoading: false,
    });
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.firebaseUser).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('logout should not affect isLoading', () => {
    useAuthStore.setState({ isLoading: false });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
