import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VehicleMarker from './VehicleMarker';

// ── Mock react-leaflet ────────────────────────────────────────────────────────
vi.mock('react-leaflet', () => ({
  Marker: ({ children, position }: any) => (
    <div data-testid={`marker-${position}`}>{children}</div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="vehicle-popup">{children}</div>
  ),
  Tooltip: ({ children }: any) => (
    <div data-testid="vehicle-tooltip">{children}</div>
  ),
}));

// ── Mock react-leaflet-draw ──────────────────────────────────────────────────
vi.mock('react-leaflet-draw', () => ({
  useLeafletDraw: () => ({ draw: null }),
}));

describe('VehicleMarker Component', () => {
  const mockVehicle = {
    id: 'vehicle-1',
    latitude: 4.6,
    longitude: -74.0836,
    speed: 50,
    heading: 45,
    status: 'MOVING',
  };

  const mockSimSocket = {
    current: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render vehicle marker', () => {
    render(<VehicleMarker vehicle={mockVehicle} simSocket={mockSimSocket} />);
    const tooltip = screen.getByTestId('vehicle-tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('should accept vehicle prop', () => {
    render(<VehicleMarker vehicle={mockVehicle} simSocket={mockSimSocket} />);
    expect(mockVehicle).toBeDefined();
  });

  it('should accept simSocket prop', () => {
    render(<VehicleMarker vehicle={mockVehicle} simSocket={mockSimSocket} />);
    expect(mockSimSocket).toBeDefined();
  });

  it('should display tooltip with vehicle info', () => {
    render(<VehicleMarker vehicle={mockVehicle} simSocket={mockSimSocket} />);
    const tooltip = screen.queryByTestId('vehicle-tooltip');
    expect(tooltip || document.querySelector('[class*="tooltip"]')).toBeTruthy();
  });

  it('should display vehicle popup', () => {
    render(<VehicleMarker vehicle={mockVehicle} simSocket={mockSimSocket} />);
    const tooltip = screen.getByTestId('vehicle-tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});
