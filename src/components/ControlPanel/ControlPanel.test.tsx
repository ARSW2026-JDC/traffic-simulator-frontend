import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ControlPanel from './ControlPanel';

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
    selectedId: null,
    selectedType: null,
    vehicles: {},
    trafficLights: {},
    simulations: [
      { simId: '1', mapId: 'map1', nVehicles: 10 },
      { simId: '2', mapId: 'map2', nVehicles: 20 }
    ],
    activeSimId: '1',
    basemapId: 'cartoLight',
    routes: [],
    tick: 0,
    isConnected: false,
    bbox: null,
    deselect: vi.fn(),
    setActiveSimId: vi.fn(),
    setFullState: vi.fn(),
    setRoutes: vi.fn(),
    setBasemapId: vi.fn(),
    selectEntity: vi.fn(),
    applyDelta: vi.fn(),
    setSimulationList: vi.fn(),
    setConnected: vi.fn(),
    setBbox: vi.fn(),
  })),
}));

describe('ControlPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render control panel with simulacion label', () => {
    render(<ControlPanel simSocket={mockSimSocket} />);
    expect(screen.getByText('Simulacion')).toBeInTheDocument();
  });

  it('should display basemap selector', () => {
    render(<ControlPanel simSocket={mockSimSocket} />);
    expect(screen.getByText('Mapa base')).toBeInTheDocument();
  });

  it('should have simulation dropdown and basemap dropdown', () => {
    render(<ControlPanel simSocket={mockSimSocket} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('should render update button', () => {
    render(<ControlPanel simSocket={mockSimSocket} />);
    const updateButton = screen.getByRole('button', { name: /actualizar|update/i });
    expect(updateButton).toBeInTheDocument();
  });

  it('should emit sync:request when update button is clicked', async () => {
    render(<ControlPanel simSocket={mockSimSocket} />);
    const updateButton = screen.getByRole('button', { name: /actualizar|update/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(mockSimSocket.current.emit).toHaveBeenCalledWith('sync:request');
    });
  });

  it('should handle simulation selection', async () => {
    render(<ControlPanel simSocket={mockSimSocket} />);
    const selects = screen.getAllByRole('combobox');
    
    fireEvent.change(selects[0], { target: { value: '1' } });
    
    await waitFor(() => {
      expect(mockSimSocket.current.emit).toHaveBeenCalled();
    });
  });
});
