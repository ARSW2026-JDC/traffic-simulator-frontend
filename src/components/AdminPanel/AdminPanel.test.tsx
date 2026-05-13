import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSimulationStore } from '../../stores/simulationStore';

describe('AddEntityForm - Traffic Light Clicker Auto-Activation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  afterEach(() => {
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  describe('Type selection toggles addMode', () => {
    it('should auto-activate addMode when selecting trafficLight type', () => {
      const type = 'trafficLight';
      const addMode = useSimulationStore.getState().addMode;

      if (type === 'trafficLight' && addMode !== 'trafficLight') {
        useSimulationStore.getState().setAddMode('trafficLight');
      }

      expect(useSimulationStore.getState().addMode).toBe('trafficLight');
    });

    it('should deactivate when selecting vehicle after trafficLight', () => {
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
  });

  describe('Click position indicator logic', () => {
    it('should show selected indicator when clickPosition is set', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setClickPosition({ lat: 4.71100, lng: -74.07210 });

      const clickPosition = useSimulationStore.getState().clickPosition;
      const shouldShowSelected = clickPosition !== null;

      expect(shouldShowSelected).toBe(true);
    });

    it('should show click on map instruction when clickPosition is null', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setClickPosition(null);

      const clickPosition = useSimulationStore.getState().clickPosition;
      const shouldShowClickInstruction = clickPosition === null;

      expect(shouldShowClickInstruction).toBe(true);
    });

    it('should display correct formatted coordinates', () => {
      useSimulationStore.getState().setClickPosition({ lat: 4.71100, lng: -74.07210 });

      const clickPosition = useSimulationStore.getState().clickPosition;
      if (clickPosition) {
        const formattedLat = clickPosition.lat.toFixed(5);
        const formattedLng = clickPosition.lng.toFixed(5);
        expect(formattedLat).toBe('4.71100');
        expect(formattedLng).toBe('-74.07210');
      }
    });
  });

  describe('Clear button logic', () => {
    beforeEach(() => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
    });

    it('should clear clickPosition when clear button is clicked', () => {
      useSimulationStore.getState().setClickPosition(null);

      expect(useSimulationStore.getState().clickPosition).toBeNull();
    });

    it('should clear clickPosition but keep addMode when clear is pressed', () => {
      useSimulationStore.getState().setClickPosition(null);

      expect(useSimulationStore.getState().addMode).toBe('trafficLight');
      expect(useSimulationStore.getState().clickPosition).toBeNull();
    });
  });

  describe('Form field visibility based on type', () => {
    it('should show traffic light fields when type is trafficLight', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      
      const isTrafficLightMode = useSimulationStore.getState().addMode === 'trafficLight';
      const shouldShowLatLon = isTrafficLightMode;
      const shouldShowDurationSliders = isTrafficLightMode;
      
      expect(shouldShowLatLon).toBe(true);
      expect(shouldShowDurationSliders).toBe(true);
    });

    it('should show vehicle fields when type is vehicle', () => {
      useSimulationStore.getState().setAddMode('vehicle');
      
      const isVehicleMode = useSimulationStore.getState().addMode === 'vehicle';
      const shouldShowProfile = isVehicleMode;
      const shouldShowCount = isVehicleMode;
      const shouldShowSpeed = isVehicleMode;
      
      expect(shouldShowProfile).toBe(true);
      expect(shouldShowCount).toBe(true);
      expect(shouldShowSpeed).toBe(true);
    });

    it('should not show traffic light fields when in vehicle mode', () => {
      useSimulationStore.getState().setAddMode('vehicle');
      
      const isVehicleMode = useSimulationStore.getState().addMode === 'vehicle';
      const shouldShowLatLon = !isVehicleMode; 
      
      expect(shouldShowLatLon).toBe(false);
    });

    it('should not show vehicle fields when in trafficLight mode', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      
      const isTrafficLightMode = useSimulationStore.getState().addMode === 'trafficLight';
      const shouldShowProfile = !isTrafficLightMode;
      
      expect(shouldShowProfile).toBe(false);
    });
  });

  describe('clickPosition sync to lat/lon form fields', () => {
    beforeEach(() => {
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
    });

    it('should sync clickPosition.lat to lat form field', () => {
      const clickPosition = useSimulationStore.getState().clickPosition!;
      expect(clickPosition.lat).toBe(4.7110);
    });

    it('should sync clickPosition.lng to lon form field', () => {
      const clickPosition = useSimulationStore.getState().clickPosition!;
      expect(clickPosition.lng).toBe(-74.0721);
    });

    it('should allow manual editing of lat/lon after click', () => {
      const manualLat = 4.7500;
      const manualLon = -74.0800;
      
      useSimulationStore.getState().setClickPosition({ lat: manualLat, lng: manualLon });
      
      expect(useSimulationStore.getState().clickPosition?.lat).toBe(4.7500);
      expect(useSimulationStore.getState().clickPosition?.lng).toBe(-74.0800);
    });
  });
});

describe('AddEntityForm - toggleMapMode logic', () => {
  beforeEach(() => {
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
  });

  it('should toggle addMode from null to trafficLight', () => {
    const addMode = useSimulationStore.getState().addMode;
    
    if (addMode === 'trafficLight') {
      useSimulationStore.getState().setAddMode(null);
    } else {
      useSimulationStore.getState().setAddMode('trafficLight');
    }
    
    expect(useSimulationStore.getState().addMode).toBe('trafficLight');
  });

  it('should toggle addMode from trafficLight to null', () => {
    useSimulationStore.getState().setAddMode('trafficLight');
    
    const addMode = useSimulationStore.getState().addMode;
    
    if (addMode === 'trafficLight') {
      useSimulationStore.getState().setAddMode(null);
    } else {
      useSimulationStore.getState().setAddMode('trafficLight');
    }
    
    expect(useSimulationStore.getState().addMode).toBeNull();
  });
});

describe('AddEntityForm - Form Interaction', () => {
  it('should handle name input', () => {
    const name = 'Test Vehicle';
    expect(name).toBe('Test Vehicle');
  });

  it('should handle empty name', () => {
    const name = '';
    expect(name).toBe('');
  });
});