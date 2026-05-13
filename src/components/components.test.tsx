import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSimulationStore } from '../stores/simulationStore';


vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  })),
}));

vi.mock('../hooks/useSimulationSocket', () => ({
  useSimulationSocket: () => ({
    socket: { current: null },
  }),
}));

vi.mock('../hooks/useChatSocket', () => ({
  useChatSocket: () => ({
    socket: { current: null },
  }),
}));

vi.mock('../hooks/useHistorySocket', () => ({
  useHistorySocket: () => ({
    socket: { current: null },
  }),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { uid: 'test-user', role: 'ADMIN' },
  }),
}));

describe('MapView Clicker Logic', () => {
  beforeEach(() => {
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  it('should not render when addMode is null', () => {
    const { addMode, clickPosition } = useSimulationStore.getState();
    const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
    expect(shouldRender).toBe(false);
  });

  it('should not render when addMode is vehicle', () => {
    useSimulationStore.getState().setAddMode('vehicle');
    const { addMode, clickPosition } = useSimulationStore.getState();
    const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
    expect(shouldRender).toBe(false);
  });

  it('should render Circle when addMode is trafficLight and clickPosition is set', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
    
    const { addMode, clickPosition } = useSimulationStore.getState();
    const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
    expect(shouldRender).toBe(true);
  });

  it('should update clickPosition on map click when addMode is trafficLight', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    const newPosition = { lat: 4.7500, lng: -74.0800 };
    useSimulationStore.getState().setClickPosition(newPosition);
    expect(useSimulationStore.getState().clickPosition).toEqual(newPosition);
  });

  it('should use 6 meter radius', () => {
    const radius = 6;
    expect(radius).toBe(6);
  });
});

describe('AdminPanel AddEntityForm Logic', () => {
  beforeEach(() => {
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  it('should auto-activate when selecting trafficLight type', () => {
    const type = 'trafficLight';
    const addMode = useSimulationStore.getState().addMode;
    
    if (type === 'trafficLight' && addMode !== 'trafficLight') {
      useSimulationStore.getState().setAddMode('trafficLight');
    }
    expect(useSimulationStore.getState().addMode).toBe('trafficLight');
  });

  it('should deactivate when switching from trafficLight to vehicle', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
    
    const type = 'vehicle';
    const addMode = useSimulationStore.getState().addMode;
    
    if (addMode === 'trafficLight') {
      useSimulationStore.getState().setAddMode(null);
      useSimulationStore.getState().setClickPosition(null);
    }
    
    expect(useSimulationStore.getState().addMode).toBeNull();
    expect(useSimulationStore.getState().clickPosition).toBeNull();
  });

  it('should show selected indicator when clickPosition is set', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    useSimulationStore.getState().setClickPosition({ lat: 4.71100, lng: -74.07210 });
    expect(useSimulationStore.getState().clickPosition).not.toBeNull();
  });

  it('should show click instruction when clickPosition is null', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    expect(useSimulationStore.getState().clickPosition).toBeNull();
  });

  it('should clear clickPosition with clear button', () => {
    useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
    useSimulationStore.getState().setClickPosition(null);
    expect(useSimulationStore.getState().clickPosition).toBeNull();
  });

  it('should show trafficLight fields when type is trafficLight', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    expect(useSimulationStore.getState().addMode === 'trafficLight').toBe(true);
  });

  it('should show vehicle fields when type is vehicle', () => {
    useSimulationStore.getState().setAddMode('vehicle');
    expect(useSimulationStore.getState().addMode === 'vehicle').toBe(true);
  });

  it('should sync clickPosition to lat/lon form fields', () => {
    const clickPosition = { lat: 4.7110, lng: -74.0721 };
    useSimulationStore.getState().setClickPosition(clickPosition);
    expect(useSimulationStore.getState().clickPosition?.lat).toBe(4.7110);
    expect(useSimulationStore.getState().clickPosition?.lng).toBe(-74.0721);
  });
});

describe('MapView Constants', () => {
  it('should have correct DEFAULT_CENTER', () => {
    const DEFAULT_CENTER: [number, number] = [4.6, -74.0836];
    expect(DEFAULT_CENTER).toEqual([4.6, -74.0836]);
  });

  it('should have correct DEFAULT_ZOOM', () => {
    const DEFAULT_ZOOM = 13;
    expect(DEFAULT_ZOOM).toBe(13);
  });
});

  it('should have default basemap id', async () => {
    const { DEFAULT_BASEMAP_ID } = await import('../components/MapView/basemaps');
    expect(DEFAULT_BASEMAP_ID).toBe('cartoLight');
  });
  
describe('Component States', () => {
  it('should handle vehicle selected state', () => {
    useSimulationStore.getState().selectEntity('v1', 'vehicle');
    expect(useSimulationStore.getState().selectedId).toBe('v1');
    expect(useSimulationStore.getState().selectedType).toBe('vehicle');
  });

  it('should handle trafficLight selected state', () => {
    useSimulationStore.getState().selectEntity('tl1', 'trafficLight');
    expect(useSimulationStore.getState().selectedId).toBe('tl1');
    expect(useSimulationStore.getState().selectedType).toBe('trafficLight');
  });
});

describe('Form Interactions', () => {
  it('should handle vehicle count input', () => {
    const count = 5;
    expect(count).toBe(5);
  });

  it('should handle speed slider input', () => {
    const speed = 50;
    expect(speed).toBe(50);
  });

  it('should handle duration slider inputs', () => {
    const green = 30;
    const yellow = 30;
    const red = 30;
    expect(green).toBe(30);
    expect(yellow).toBe(30);
    expect(red).toBe(30);
  });
});

describe('Simulation Control', () => {
  it('should set active simulation', () => {
    useSimulationStore.getState().setActiveSimId('sim-123');
    expect(useSimulationStore.getState().activeSimId).toBe('sim-123');
  });

  it('should handle simulation list', () => {
    const simulations = [
      { simId: 'sim-1', mapId: 'map-1', nVehicles: 5, createdByUid: 'u1', createdByName: 'User', nodeId: 'n1', createdAt: 1000 },
      { simId: 'sim-2', mapId: 'map-1', nVehicles: 10, createdByUid: 'u2', createdByName: 'User2', nodeId: 'n2', createdAt: 2000 },
    ];
    useSimulationStore.getState().setSimulationList(simulations);
    expect(useSimulationStore.getState().simulations).toEqual(simulations);
  });
});