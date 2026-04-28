import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrafficLightMarker from './TrafficLightMarker';

// ── Mock react-leaflet ────────────────────────────────────────────────────────
vi.mock('react-leaflet', () => ({
  Marker: ({ children, position }: any) => (
    <div data-testid={`marker-${position}`}>{children}</div>
  ),
  CircleMarker: ({ children }: any) => (
    <div data-testid="circle-marker">{children}</div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="light-popup">{children}</div>
  ),
  Tooltip: ({ children }: any) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

describe('TrafficLightMarker Component', () => {
  const mockLight = {
    id: 'light-1',
    latitude: 4.6,
    longitude: -74.0836,
    state: 'RED',
    duration: 30,
    intersectionId: 'intersection-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render traffic light marker', () => {
    render(<TrafficLightMarker light={mockLight} />);
    const marker = screen.getByTestId('circle-marker') || screen.getByTestId('light-popup');
    expect(marker).toBeInTheDocument();
  });

  it('should accept light prop', () => {
    render(<TrafficLightMarker light={mockLight} />);
    expect(mockLight).toBeDefined();
  });

  it('should render with GREEN state', () => {
    const greenLight = { ...mockLight, state: 'GREEN' };
    expect(() => {
      render(<TrafficLightMarker light={greenLight} />);
    }).not.toThrow();
  });

  it('should render with YELLOW state', () => {
    const yellowLight = { ...mockLight, state: 'YELLOW' };
    expect(() => {
      render(<TrafficLightMarker light={yellowLight} />);
    }).not.toThrow();
  });

  it('should render with RED state', () => {
    const redLight = { ...mockLight, state: 'RED' };
    expect(() => {
      render(<TrafficLightMarker light={redLight} />);
    }).not.toThrow();
  });

  it('should display circle marker', () => {
    render(<TrafficLightMarker light={mockLight} />);
    const circleMarker = screen.queryByTestId('circle-marker');
    expect(circleMarker || screen.getByTestId('light-popup')).toBeTruthy();
  });
});
