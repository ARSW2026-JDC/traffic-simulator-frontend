import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from './simulationStore';

describe('simulationStore', () => {
  beforeEach(() => {
    useSimulationStore.getState().deselect();
    useSimulationStore.getState().setAddMode(null);
    useSimulationStore.getState().setClickPosition(null);
    useSimulationStore.getState().setErrorMessage(null);
  });

  describe('addMode', () => {
    it('should start with null addMode', () => {
      expect(useSimulationStore.getState().addMode).toBeNull();
    });

    it('should set addMode to trafficLight', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      expect(useSimulationStore.getState().addMode).toBe('trafficLight');
    });

    it('should set addMode to vehicle', () => {
      useSimulationStore.getState().setAddMode('vehicle');
      expect(useSimulationStore.getState().addMode).toBe('vehicle');
    });

    it('should clear addMode when set to null', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setAddMode(null);
      expect(useSimulationStore.getState().addMode).toBeNull();
    });

    it('should allow switching from trafficLight to vehicle', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setAddMode('vehicle');
      expect(useSimulationStore.getState().addMode).toBe('vehicle');
    });
  });

  describe('clickPosition', () => {
    it('should start with null clickPosition', () => {
      expect(useSimulationStore.getState().clickPosition).toBeNull();
    });

    it('should set clickPosition with lat/lng', () => {
      const position = { lat: 4.7110, lng: -74.0721 };
      useSimulationStore.getState().setClickPosition(position);
      expect(useSimulationStore.getState().clickPosition).toEqual(position);
    });

    it('should clear clickPosition when set to null', () => {
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
      useSimulationStore.getState().setClickPosition(null);
      expect(useSimulationStore.getState().clickPosition).toBeNull();
    });

    it('should update clickPosition with new coordinates', () => {
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });
      useSimulationStore.getState().setClickPosition({ lat: 4.7500, lng: -74.0800 });
      expect(useSimulationStore.getState().clickPosition).toEqual({ lat: 4.7500, lng: -74.0800 });
    });
  });

  describe('addMode and clickPosition interaction', () => {
    it('should allow setting addMode and clickPosition independently', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });

      expect(useSimulationStore.getState().addMode).toBe('trafficLight');
      expect(useSimulationStore.getState().clickPosition).toEqual({ lat: 4.7110, lng: -74.0721 });
    });

    it('should clear both when reset', () => {
      useSimulationStore.getState().setAddMode('trafficLight');
      useSimulationStore.getState().setClickPosition({ lat: 4.7110, lng: -74.0721 });

      useSimulationStore.getState().setAddMode(null);
      useSimulationStore.getState().setClickPosition(null);

      expect(useSimulationStore.getState().addMode).toBeNull();
      expect(useSimulationStore.getState().clickPosition).toBeNull();
    });
  });

  describe('errorMessage', () => {
    it('should start with null errorMessage', () => {
      expect(useSimulationStore.getState().errorMessage).toBeNull();
    });

    it('should set errorMessage', () => {
      useSimulationStore.getState().setErrorMessage('Test error');
      expect(useSimulationStore.getState().errorMessage).toBe('Test error');
    });

    it('should clear errorMessage', () => {
      useSimulationStore.getState().setErrorMessage('Test error');
      useSimulationStore.getState().setErrorMessage(null);
      expect(useSimulationStore.getState().errorMessage).toBeNull();
    });
  });

  describe('selection', () => {
    it('should select entity', () => {
      useSimulationStore.getState().selectEntity('tl-1', 'trafficLight');
      expect(useSimulationStore.getState().selectedId).toBe('tl-1');
      expect(useSimulationStore.getState().selectedType).toBe('trafficLight');
    });

    it('should deselect entity', () => {
      useSimulationStore.getState().selectEntity('tl-1', 'trafficLight');
      useSimulationStore.getState().deselect();
      expect(useSimulationStore.getState().selectedId).toBeNull();
      expect(useSimulationStore.getState().selectedType).toBeNull();
    });
  });

  describe('full state operations', () => {
    it('should set full state with vehicles and traffic lights', () => {
      const vehicles = { 'v-1': { id: 'v-1', lat: 4.7110, lon: -74.0721, speed: 10, heading: 45, color: '#FF0000' } };
      const trafficLights = { 'tl-1': { id: 'tl-1', lat: 4.7110, lon: -74.0721, state: 'red', greenDuration: 30, nodeId: 1 } };

      useSimulationStore.getState().setFullState(vehicles, trafficLights, 100);

      expect(useSimulationStore.getState().vehicles).toEqual(vehicles);
      expect(useSimulationStore.getState().trafficLights).toEqual(trafficLights);
      expect(useSimulationStore.getState().tick).toBe(100);
    });

    it('should apply delta updates to vehicles', () => {
      useSimulationStore.getState().setFullState(
        { 'v-1': { id: 'v-1', lat: 4.7110, lon: -74.0721, speed: 10, heading: 45, color: '#FF0000' } },
        {},
        0
      );

      const delta = {
        vehicles: { 'v-1': { speed: 20 } },
        trafficLights: {},
        removed: [],
        tick: 1
      };

      useSimulationStore.getState().applyDelta(delta);

      expect(useSimulationStore.getState().vehicles['v-1']?.speed).toBe(20);
      expect(useSimulationStore.getState().tick).toBe(1);
    });

    it('should apply delta updates to traffic lights', () => {
      useSimulationStore.getState().setFullState(
        {},
        { 'tl-1': { id: 'tl-1', lat: 4.7110, lon: -74.0721, state: 'red', greenDuration: 30, nodeId: 1 } },
        0
      );

      const delta = {
        vehicles: {},
        trafficLights: { 'tl-1': { state: 'green' } },
        removed: [],
        tick: 1
      };

      useSimulationStore.getState().applyDelta(delta);

      expect(useSimulationStore.getState().trafficLights['tl-1']?.state).toBe('green');
    });

    it('should remove deleted entities from delta', () => {
      useSimulationStore.getState().setFullState(
        { 'v-1': { id: 'v-1', lat: 4.7110, lon: -74.0721, speed: 10, heading: 45, color: '#FF0000' } },
        { 'tl-1': { id: 'tl-1', lat: 4.7110, lon: -74.0721, state: 'red', greenDuration: 30, nodeId: 1 } },
        0
      );

      const delta = {
        vehicles: {},
        trafficLights: {},
        removed: ['v-1', 'tl-1'],
        tick: 1
      };

      useSimulationStore.getState().applyDelta(delta);

      expect(useSimulationStore.getState().vehicles['v-1']).toBeUndefined();
      expect(useSimulationStore.getState().trafficLights['tl-1']).toBeUndefined();
    });
  });

  describe('simulation list and active sim', () => {
    it('should set simulation list', () => {
      const simulations = [{ id: 'sim-1', name: 'Test Sim', vehicleCount: 5, trafficLightCount: 3 }];
      useSimulationStore.getState().setSimulationList(simulations);
      expect(useSimulationStore.getState().simulations).toEqual(simulations);
    });

    it('should set active sim id', () => {
      useSimulationStore.getState().setActiveSimId('sim-1');
      expect(useSimulationStore.getState().activeSimId).toBe('sim-1');
    });

    it('should set active sim id to null', () => {
      useSimulationStore.getState().setActiveSimId('sim-1');
      useSimulationStore.getState().setActiveSimId(null);
      expect(useSimulationStore.getState().activeSimId).toBeNull();
    });
  });

  describe('basemap', () => {
    it('should set basemap id', () => {
      useSimulationStore.getState().setBasemapId('cartoDark');
      expect(useSimulationStore.getState().basemapId).toBe('cartoDark');
    });
  });

  describe('connection state', () => {
    it('should set connected state', () => {
      useSimulationStore.getState().setConnected(true);
      expect(useSimulationStore.getState().isConnected).toBe(true);
    });

    it('should set disconnected state', () => {
      useSimulationStore.getState().setConnected(true);
      useSimulationStore.getState().setConnected(false);
      expect(useSimulationStore.getState().isConnected).toBe(false);
    });
  });
});