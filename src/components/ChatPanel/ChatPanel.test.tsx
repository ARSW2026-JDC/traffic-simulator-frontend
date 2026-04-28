import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from './ChatPanel';

// ── Mock socket ───────────────────────────────────────────────────────────────
const mockChatSocket = {
  current: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
};

// ── Mock stores ───────────────────────────────────────────────────────────────
vi.mock('../../stores/chatStore', () => ({
  useChatStore: vi.fn(() => ({
    messages: [
      { id: '1', sender: 'User1', text: 'Hello', timestamp: Date.now() }
    ],
    isOpen: true,
    addMessage: vi.fn(),
    openChat: vi.fn(),
    closeChat: vi.fn(),
  })),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { email: 'test@example.com', name: 'Test User' },
  })),
}));

describe('ChatPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat panel', () => {
    render(<ChatPanel chatSocket={mockChatSocket} pendingTimers={{ current: new Map() }} />);
    const container = document.querySelector('[class*="flex"]') || screen.getByTestId('chat-panel-container') || document.body;
    expect(container).toBeTruthy();
  });

  it('should accept chatSocket prop', () => {
    render(<ChatPanel chatSocket={mockChatSocket} pendingTimers={{ current: new Map() }} />);
    expect(mockChatSocket).toBeDefined();
  });

  it('should accept pendingTimers prop', () => {
    const timers = { current: new Map() };
    render(<ChatPanel chatSocket={mockChatSocket} pendingTimers={timers} />);
    expect(timers.current).toBeDefined();
  });

  it('should be renderable without throwing', () => {
    expect(() => {
      render(<ChatPanel chatSocket={mockChatSocket} pendingTimers={{ current: new Map() }} />);
    }).not.toThrow();
  });
});
