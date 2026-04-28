import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from './historyStore';
import type { ChangeLogEntry } from '../types';

const makeEntry = (overrides: Partial<ChangeLogEntry> = {}): ChangeLogEntry => ({
  id: 'entry-1',
  userId: 'user-1',
  userName: 'Alice',
  entityType: 'vehicle',
  entityId: 'v-1',
  field: 'speed',
  oldValue: '10',
  newValue: '20',
  timestamp: 1000,
  ...overrides,
});

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [], isLoading: false });
  });

  it('should have correct initial state', () => {
    const state = useHistoryStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('setLoading should update isLoading', () => {
    useHistoryStore.getState().setLoading(true);
    expect(useHistoryStore.getState().isLoading).toBe(true);
    useHistoryStore.getState().setLoading(false);
    expect(useHistoryStore.getState().isLoading).toBe(false);
  });

  it('setEntries should replace entries array', () => {
    const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
    useHistoryStore.getState().setEntries(entries);
    expect(useHistoryStore.getState().entries).toEqual(entries);
  });

  it('addEntry should prepend entry to list', () => {
    const e1 = makeEntry({ id: 'first' });
    const e2 = makeEntry({ id: 'second' });
    useHistoryStore.getState().addEntry(e1);
    useHistoryStore.getState().addEntry(e2);
    const entries = useHistoryStore.getState().entries;
    expect(entries[0].id).toBe('second'); // most recent first
    expect(entries[1].id).toBe('first');
  });

  it('addEntry should cap at 200 entries', () => {
    const many = Array.from({ length: 205 }, (_, i) => makeEntry({ id: `e-${i}` }));
    many.forEach((e) => useHistoryStore.getState().addEntry(e));
    expect(useHistoryStore.getState().entries.length).toBeLessThanOrEqual(200);
  });

  it('addEntry should keep newest entries when capping', () => {
    const many = Array.from({ length: 205 }, (_, i) => makeEntry({ id: `e-${i}` }));
    many.forEach((e) => useHistoryStore.getState().addEntry(e));
    // The last added entry should be first
    expect(useHistoryStore.getState().entries[0].id).toBe('e-204');
  });
});
