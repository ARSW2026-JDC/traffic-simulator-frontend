import { create } from 'zustand';
import type { ChangeLogEntry } from '../types';

interface HistoryStore {
  entries: ChangeLogEntry[];
  isLoading: boolean;
  addEntry: (e: ChangeLogEntry) => void;
  setEntries: (entries: ChangeLogEntry[]) => void;
  setLoading: (v: boolean) => void;
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: [],
  isLoading: false,
  addEntry: (e) =>
    set((state) => ({
      entries: [e, ...state.entries.slice(0, 199)],
    })),
  setEntries: (entries) => set({ entries }),
  setLoading: (isLoading) => set({ isLoading }),
}));
