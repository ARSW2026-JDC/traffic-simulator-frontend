import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPanel from './AdminPanel';

// ── Mock socket ───────────────────────────────────────────────────────────────
const mockSimSocket = {
  current: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
};

// ── Mock stores ───────────────────────────────────────────────────────────────
vi.mock('../../stores/simulationStore', () => ({
  useSimulationStore: vi.fn(() => ({
    roads: [],
    intersections: [],
    trafficLights: {},
    vehicles: {},
    config: {
      gridWidth: 100,
      gridHeight: 100,
      vehicleSpeed: 50,
      trafficLightDuration: 30,
    },
    updateConfig: vi.fn(),
    addRoad: vi.fn(),
    addIntersection: vi.fn(),
    addTrafficLight: vi.fn(),
  })),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { email: 'admin@example.com', role: 'admin' },
  })),
}));

describe('AdminPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin panel', () => {
    render(<AdminPanel simSocket={mockSimSocket} />);
    expect(screen.getByText('vehicles')).toBeInTheDocument();
  });

  it('should display configuration settings', () => {
    render(<AdminPanel simSocket={mockSimSocket} />);
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons.length).toBeGreaterThan(0);
  });

  it('should have subtab buttons for vehicles, lights, add, and simulation', () => {
    render(<AdminPanel simSocket={mockSimSocket} />);
    expect(screen.getByText('vehicles')).toBeInTheDocument();
    expect(screen.getByText('lights')).toBeInTheDocument();
    expect(screen.getByText('add')).toBeInTheDocument();
    expect(screen.getByText('simulation')).toBeInTheDocument();
  });

  it('should switch tabs when tab button is clicked', async () => {
    render(<AdminPanel simSocket={mockSimSocket} />);
    const lightsTab = screen.getByText('lights');
    fireEvent.click(lightsTab);
    
    await waitFor(() => {
      expect(lightsTab).toHaveClass('border-b-2');
    });
  });

  it('should have multiple tabs accessible', () => {
    render(<AdminPanel simSocket={mockSimSocket} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });
});
