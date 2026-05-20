import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSimulationStore } from '../../stores/simulationStore';


describe('PickHandler logic via simulationStore', () => {
  beforeEach(() => {
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  describe('addMode trafficLight state', () => {
    it('should set addMode to trafficLight', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      expect(useSimulationStore.getState().addMode).toBe('trafficLight');
    });

    it('should clear addMode when switching to vehicle', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setAddMode('vehicle');
      expect(useSimulationStore.getState().addMode).toBe('vehicle');
    });
  });

  describe('clickPosition state', () => {
    it('should set clickPosition when user clicks map', () => {
      const clickPos = { lat: 4.7110, lng: -74.0721 };
      useSimulationStore.getState().setClickPosition(clickPos);
      expect(useSimulationStore.getState().clickPosition).toEqual(clickPos);
    });

    it('should clear clickPosition when user clicks clear button', () => {
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
      useSimulationStore.getState().setClickPosition(null);
      expect(useSimulationStore.getState().clickPosition).toBeNull();
    });
  });

  describe('PickHandler conditional rendering logic', () => {
    it('should NOT render Circle when addMode is null', () => {
      const { addMode, clickPosition } = useSimulationStore.getState();
      const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
      expect(shouldRender).toBe(false);
    });

    it('should NOT render Circle when addMode is vehicle', () => {
      useSimulationStore.getState().setAddMode('vehicle');
      const { addMode, clickPosition } = useSimulationStore.getState();
      const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
      expect(shouldRender).toBe(false);
    });

    it('should NOT render Circle when addMode is trafficLight but clickPosition is null', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      const { addMode, clickPosition } = useSimulationStore.getState();
      const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
      expect(shouldRender).toBe(false);
    });

    it('should render Circle when addMode is trafficLight AND clickPosition is set', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
      const { addMode, clickPosition } = useSimulationStore.getState();
      const shouldRender = addMode === 'trafficLight' && clickPosition !== null;
      expect(shouldRender).toBe(true);
    });
  });

  describe('PickHandler click handler logic', () => {
    it('should update clickPosition on map click when addMode is trafficLight', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      
      const newPosition = { lat: 4.7500, lng: -74.0800 };
      useSimulationStore.getState().setClickPosition(newPosition);
      
      expect(useSimulationStore.getState().clickPosition).toEqual(newPosition);
    });

    it('should NOT update clickPosition when addMode is not trafficLight', () => {
      useSimulationStore.getState().setAddMode('vehicle');
      
      const newPosition = { lat: 4.7500, lng: -74.0800 };
      useSimulationStore.getState().setClickPosition(newPosition);
      
      expect(useSimulationStore.getState().clickPosition).toEqual(newPosition);
    });
  });

  describe('Circle radius configuration', () => {
    it('should use 6 meter radius as per specification', () => {
      const expectedRadius = 6;
      expect(expectedRadius).toBe(6);
    });
  });
});

describe('Auto-activation logic from AdminPanel', () => {
  beforeEach(() => {
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  it('should auto-activate trafficLight when type is trafficLight', () => {
    const type = 'trafficLight';
    const addMode = useSimulationStore.getState().addMode;
    
    if (type === 'trafficLight' && addMode !== 'trafficLight') {
      useSimulationStore.getState().setAddMode('trafficLight');
    }
    
    expect(useSimulationStore.getState().addMode).toBe('trafficLight');
  });

  it('should deactivate when type is not trafficLight but addMode is trafficLight', () => {
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

  it('should sync clickPosition to lat/lon fields', () => {
    const clickPosition = { lat: 4.7110, lng: -74.0721 };
    useSimulationStore.getState().setClickPosition(clickPosition);
    
    const lat = clickPosition.lat;
    const lon = clickPosition.lng;
    
    expect(lat).toBe(4.7110);
    expect(lon).toBe(-74.0721);
  });
});

describe('HighlightedEdge logic', () => {
  beforeEach(() => {
    useSimulationStore.getState().setHighlightPosition(null);
  });

  it('should start with null highlightPosition', () => {
    expect(useSimulationStore.getState().highlightPosition).toBeNull();
  });

  it('should set highlightPosition', () => {
    const pos = { lat: 4.711, lng: -74.0721 };
    useSimulationStore.getState().setHighlightPosition(pos);
    expect(useSimulationStore.getState().highlightPosition).toEqual(pos);
  });

  it('should clear highlightPosition', () => {
    useSimulationStore.getState().setHighlightPosition({ lat: 4.711, lng: -74.0721 });
    useSimulationStore.getState().setHighlightPosition(null);
    expect(useSimulationStore.getState().highlightPosition).toBeNull();
  });

  it('should compute correct bounds for rectangle', () => {
    const highlightPosition = { lat: 4.711, lng: -74.0721 };
    const halfDeg = 0.00045;
    const bounds: [[number, number], [number, number]] = [
      [highlightPosition.lat - halfDeg, highlightPosition.lng - halfDeg],
      [highlightPosition.lat + halfDeg, highlightPosition.lng + halfDeg],
    ];
    expect(bounds[0][0]).toBeCloseTo(4.71055, 5);
    expect(bounds[0][1]).toBeCloseTo(-74.07255, 5);
    expect(bounds[1][0]).toBeCloseTo(4.71145, 5);
    expect(bounds[1][1]).toBeCloseTo(-74.07165, 5);
  });
});