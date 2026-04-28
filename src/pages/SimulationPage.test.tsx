import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock hooks ────────────────────────────────────────────────────────────────
vi.mock('../hooks/useSimulationSocket', () => ({
  useSimulationSocket: vi.fn(() => ({ current: null })),
}));
vi.mock('../hooks/useChatSocket', () => ({
  useChatSocket: vi.fn(() => ({ socketRef: { current: null }, pendingTimers: { current: new Map() } })),
}));
vi.mock('../hooks/useHistorySocket', () => ({
  useHistorySocket: vi.fn(() => ({ current: null })),
}));

// ── Mock heavy components ─────────────────────────────────────────────────────
vi.mock('../components/MapView/MapView', () => ({
  default: () => <div data-testid="map-view">MapView</div>,
}));
vi.mock('../components/Sidebar/LeftPanel', () => ({
  default: ({ openMobile }: { openMobile: boolean }) => (
    <div data-testid="left-panel" data-open={openMobile}>LeftPanel</div>
  ),
}));
vi.mock('../components/Sidebar/RightPanel', () => ({
  default: () => <div data-testid="right-panel">RightPanel</div>,
}));
vi.mock('../components/Navbar/Navbar', () => ({
  default: ({ onToggleLeft }: { onToggleLeft: () => void }) => (
    <div data-testid="sim-navbar">
      <button onClick={onToggleLeft} id="toggle-left">Toggle</button>
    </div>
  ),
}));

vi.mock('../services/firebase', () => ({ auth: { currentUser: null } }));

import SimulationPage from './SimulationPage';

const renderSimPage = () =>
  render(
    <MemoryRouter>
      <SimulationPage />
    </MemoryRouter>,
  );

describe('SimulationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sim-root container', () => {
    const { container } = renderSimPage();
    expect(container.querySelector('.sim-root')).toBeDefined();
  });

  it('should render Navbar', () => {
    renderSimPage();
    expect(screen.getByTestId('sim-navbar')).toBeDefined();
  });

  it('should render MapView', () => {
    renderSimPage();
    expect(screen.getByTestId('map-view')).toBeDefined();
  });

  it('should render LeftPanel', () => {
    renderSimPage();
    expect(screen.getByTestId('left-panel')).toBeDefined();
  });

  it('should render RightPanel', () => {
    renderSimPage();
    expect(screen.getByTestId('right-panel')).toBeDefined();
  });

  it('should toggle leftOpen state when Navbar onToggleLeft is called', () => {
    renderSimPage();
    const leftPanel = screen.getByTestId('left-panel');
    expect(leftPanel.getAttribute('data-open')).toBe('false');
    // Click the toggle button in the mocked Navbar
    const toggleBtn = screen.getByRole('button', { name: 'Toggle' });
    fireEvent.click(toggleBtn);
    // data-open should now be "true"
    expect(screen.getByTestId('left-panel').getAttribute('data-open')).toBe('true');
  });
});
