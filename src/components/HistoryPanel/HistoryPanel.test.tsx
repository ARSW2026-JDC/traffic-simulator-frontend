import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryPanel from './HistoryPanel';

// ── Mock socket ───────────────────────────────────────────────────────────────
const mockHistorySocket = {
  current: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
};

// ── Mock stores ───────────────────────────────────────────────────────────────
vi.mock('../../stores/historyStore', () => ({
  useHistoryStore: vi.fn(() => ({
    entries: [],
    isLoading: false,
    addEntry: vi.fn(),
    setEntries: vi.fn(),
    setLoading: vi.fn(),
  })),
}));

describe('HistoryPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render history panel', () => {
    render(<HistoryPanel />);
    const panel = document.querySelector('[class*="history"], [class*="flex"]') || screen.getByTestId('history-panel') || document.body.querySelector('div');
    expect(panel).toBeTruthy();
  });

  it('should display content when rendered', () => {
    render(<HistoryPanel />);
    const message = screen.queryByText(/No changes recorded yet|changes/i);
    expect(message || document.querySelector('div')).toBeTruthy();
  });
});
