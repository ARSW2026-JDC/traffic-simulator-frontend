import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSimulationStore } from '../../stores/simulationStore';
import { createVehicle, createTrafficLight, createSimStats } from '../../test/factories';
import StatsBar from './StatsBar';

vi.mock('react-leaflet', () => ({ useMap: vi.fn(() => ({ flyTo: vi.fn() })) }));

beforeEach(() => {
  useSimulationStore.getState().setActiveSimId(null);
  useSimulationStore.getState().setFullState({}, {}, 0);
  useSimulationStore.getState().setSimStats(null);
});

function setSimData(vCount: number, tlCount: number) {
  const vehicles: Record<string, ReturnType<typeof createVehicle>> = {};
  for (let i = 0; i < vCount; i++) {
    vehicles[`v-${i}`] = createVehicle({ id: `v-${i}`, name: `V-${i}`, speed: 20 + i });
  }
  const trafficLights: Record<string, ReturnType<typeof createTrafficLight>> = {};
  for (let i = 0; i < tlCount; i++) {
    trafficLights[`tl-${i}`] = createTrafficLight({ id: `tl-${i}`, name: `TL-${i}` });
  }
  useSimulationStore.getState().setFullState(vehicles, trafficLights, 0);
}

describe('StatsBar visibility', () => {
  it('renders nothing when no active simulation', () => {
    const { container } = render(<StatsBar />);
    expect(container.innerHTML).toBe('');
  });

  it('renders collapsed bar when simulation is active', () => {
    useSimulationStore.getState().setActiveSimId('sim-1');
    setSimData(3, 2);
    render(<StatsBar />);
    const btn = screen.getByTitle(/Haz clic para ver estadísticas/);
    expect(btn).toBeInTheDocument();
  });
});

describe('StatsBar collapsed counters', () => {
  beforeEach(() => {
    useSimulationStore.getState().setActiveSimId('sim-1');
    setSimData(5, 3);
  });

  it('shows vehicle count', () => {
    render(<StatsBar />);
    const items = screen.getAllByText('5');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('shows total semaphores', () => {
    render(<StatsBar />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('StatsBar expanded', () => {
  beforeEach(() => {
    useSimulationStore.getState().setActiveSimId('sim-1');
    setSimData(5, 3);
    const stats = createSimStats({
      avgSpeed: 30, vehicleCount: 5, movingCount: 3, waitingCount: 1, stoppedCount: 1,
      greenLightCount: 1, yellowLightCount: 1, redLightCount: 1, totalLights: 3,
    });
    useSimulationStore.getState().setSimStats(stats);
  });

  function expand() {
    fireEvent.click(screen.getByTitle(/Haz clic/));
  }

  it('shows panel after clicking', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText('📊 Estadísticas')).toBeInTheDocument();
  });

  it('shows vehicle breakdown', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText('En movimiento')).toBeInTheDocument();
    expect(screen.getByText('Esperando')).toBeInTheDocument();
    expect(screen.getByText('Detenidos')).toBeInTheDocument();
  });

  it('shows traffic light breakdown', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText('Verdes')).toBeInTheDocument();
    expect(screen.getByText('Amarillos')).toBeInTheDocument();
    expect(screen.getByText('Rojos')).toBeInTheDocument();
  });

  it('shows profile counts', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText('Agresivos')).toBeInTheDocument();
    expect(screen.getByText('Normales')).toBeInTheDocument();
  });

  it('collapses on Escape', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText('📊 Estadísticas')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('📊 Estadísticas')).not.toBeInTheDocument();
  });

  it('shows congested edge section', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText(/Calle congestionada/)).toBeInTheDocument();
  });

  it('clicking congested edge sets highlightPosition', () => {
    render(<StatsBar />);
    expand();
    fireEvent.click(screen.getByText(/Calle congestionada/));
    const pos = useSimulationStore.getState().highlightPosition;
    expect(pos).toEqual({ lat: 4.711, lng: -74.0721 });
  });

  it('collapses when clicking outside the panel', () => {
    render(<StatsBar />);
    expand();
    expect(screen.getByText('📊 Estadísticas')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('📊 Estadísticas')).not.toBeInTheDocument();
  });
});

describe('StatsBar edge cases', () => {
  beforeEach(() => {
    useSimulationStore.getState().setActiveSimId('sim-1');
  });

  it('handles zero vehicles and zero lights', () => {
    setSimData(0, 0);
    render(<StatsBar />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it('handles zero traffic lights with vehicles present', () => {
    setSimData(1, 0);
    render(<StatsBar />);
    const btn = screen.getByTitle(/Haz clic/);
    expect(btn).toBeInTheDocument();
  });
});

describe('StatsBar simStats override', () => {
  beforeEach(() => {
    useSimulationStore.getState().setActiveSimId('sim-1');
    setSimData(10, 5);
  });

  it('uses localStats when simStats is null', () => {
    render(<StatsBar />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('uses simStats values when present', () => {
    useSimulationStore.getState().setSimStats(createSimStats({ vehicleCount: 99, avgSpeed: 50 }));
    render(<StatsBar />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });
});

describe('StatsBar congested edge without vehicles', () => {
  beforeEach(() => {
    useSimulationStore.getState().setActiveSimId('sim-1');
    setSimData(0, 1);
    useSimulationStore.getState().setSimStats(createSimStats({
      vehicleCount: 0, mostCongestedEdge: { edgeId: 5, highwayType: 'secondary', vehicleCount: 3, avgSpeed: 10, lat: 4.71, lng: -74.07 },
    }));
  });

  it('shows congestion with 0% when no vehicles', () => {
    render(<StatsBar />);
    fireEvent.click(screen.getByTitle(/Haz clic/));
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
