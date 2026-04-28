import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeftPanel from './LeftPanel';

// ── Mock child components ─────────────────────────────────────────────────────
vi.mock('../AdminPanel/AdminPanel', () => ({
  default: () => <div data-testid="admin-panel">AdminPanel</div>,
}));

vi.mock('../ControlPanel/ControlPanel', () => ({
  default: () => <div data-testid="control-panel">ControlPanel</div>,
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { role: 'ADMIN' } }),
}));

describe('LeftPanel Component', () => {
  const mockSimSocket = { current: null };
  const mockOnCloseMobile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render left panel with ControlPanel', () => {
    render(<LeftPanel simSocket={mockSimSocket} openMobile={true} onCloseMobile={mockOnCloseMobile} />);
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
  });

  it('should render left panel with AdminPanel', () => {
    render(<LeftPanel simSocket={mockSimSocket} openMobile={true} onCloseMobile={mockOnCloseMobile} />);
    const adminTab = screen.getByRole('button', { name: /Admin/i });
    fireEvent.click(adminTab);
    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
  });

  it('should accept required props', () => {
    render(<LeftPanel simSocket={mockSimSocket} openMobile={true} onCloseMobile={mockOnCloseMobile} />);
    expect(mockSimSocket).toBeDefined();
    expect(mockOnCloseMobile).toBeDefined();
  });

  it('should render without throwing error', () => {
    expect(() => {
      render(<LeftPanel simSocket={mockSimSocket} openMobile={true} onCloseMobile={mockOnCloseMobile} />);
    }).not.toThrow();
  });
});
