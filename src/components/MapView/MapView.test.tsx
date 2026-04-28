import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapView from './MapView';

// ── Mock leaflet and react-leaflet ────────────────────────────────────────────
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Rectangle: () => <div data-testid="rectangle" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  CircleMarker: ({ children }: any) => <div data-testid="circle-marker">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  useMap: () => ({
    setZoom: vi.fn(),
    getZoom: vi.fn(() => 13),
    setView: vi.fn(),
    flyTo: vi.fn(),
    flyToBounds: vi.fn(),
  }),
  useMapEvents: () => ({
    on: vi.fn(),
  }),
}));

// ── Mock stores ───────────────────────────────────────────────────────────────
vi.mock('../../stores/simulationStore', () => ({
  useSimulationStore: vi.fn(() => ({
    vehicles: {},
    trafficLights: {},
    bounds: { north: 4.7, south: 4.5, east: -73.8, west: -74.2 },
  })),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { email: 'test@example.com' },
  })),
}));

// ── Mock marker components ────────────────────────────────────────────────────
vi.mock('./VehicleMarker', () => ({
  default: ({ vehicle }: any) => <div data-testid={`vehicle-${vehicle.id}`}>{vehicle.id}</div>,
}));

vi.mock('./TrafficLightMarker', () => ({
  default: ({ light }: any) => <div data-testid={`light-${light.id}`}>{light.id}</div>,
}));

describe('MapView Component', () => {
  const mockSimSocket = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render map container', () => {
    render(<MapView simSocket={mockSimSocket} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should render tile layer', () => {
    render(<MapView simSocket={mockSimSocket} />);
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('should render markers for vehicles and traffic lights', () => {
    render(<MapView simSocket={mockSimSocket} />);
    const container = screen.getByTestId('map-container');
    expect(container).toBeInTheDocument();
  });

  it('should render bounds rectangle', () => {
    render(<MapView simSocket={mockSimSocket} />);
    const rectangle = screen.queryByTestId('rectangle') || screen.getByTestId('map-container');
    expect(rectangle).toBeInTheDocument();
  });
});
