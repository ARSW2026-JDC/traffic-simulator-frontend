import { create } from 'zustand';
import type { UserProfile } from '../types';
import { User } from 'firebase/auth/cordova';

interface AuthStore {
  firebaseUser: User | null;
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  setFirebaseUser: (user: User | null, token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  firebaseUser: null,
  token: null,
  user: null,
  isLoading: true,
  setFirebaseUser: (firebaseUser, token) => set({ firebaseUser, token }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    set({ firebaseUser: null, token: null, user: null });
    sessionStorage.clear();
},
}));
