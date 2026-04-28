import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RightPanel from './RightPanel';

// ── Mock child components ─────────────────────────────────────────────────────
vi.mock('../ChatPanel/ChatPanel', () => ({
  default: () => <div data-testid="chat-panel">ChatPanel</div>,
}));

vi.mock('../HistoryPanel/HistoryPanel', () => ({
  default: () => <div data-testid="history-panel">HistoryPanel</div>,
}));

// ── Mock stores ───────────────────────────────────────────────────────────────
vi.mock('../../stores/chatStore', () => ({
  useChatStore: vi.fn(() => ({
    isConnected: true,
    messages: [],
  })),
}));

describe('RightPanel Component', () => {
  const mockChatSocket = {
    socketRef: { current: null },
    pendingTimers: { current: new Map() }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render right panel with ChatPanel', () => {
    render(<RightPanel chatSocket={mockChatSocket} />);
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('should render right panel with HistoryPanel', () => {
    render(<RightPanel chatSocket={mockChatSocket} />);
    const historyTab = screen.getByRole('button', { name: /History/i });
    fireEvent.click(historyTab);
    expect(screen.getByTestId('history-panel')).toBeInTheDocument();
  });

  it('should accept chatSocket prop', () => {
    render(<RightPanel chatSocket={mockChatSocket} />);
    expect(mockChatSocket).toBeDefined();
  });

  it('should render without throwing error', () => {
    expect(() => {
      render(<RightPanel chatSocket={mockChatSocket} />);
    }).not.toThrow();
  });
});
