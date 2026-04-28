import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from './simulationStore';
import type { Vehicle, TrafficLight, SimulationDelta, SimulationSummary, BBox, RouteInfo } from '../types';

const makeVehicle = (id: string, overrides: Partial<Vehicle> = {}): Vehicle => ({
  id,
  name: `Vehicle ${id}`,
  lat: 4.6,
  lon: -74.1,
  speed: 50,
  color: '#FF0000',
  heading: 0,
  routeId: 'route-1',
  waypointIndex: 0,
  status: 'moving',
  ...overrides,
});

const makeTrafficLight = (id: string, overrides: Partial<TrafficLight> = {}): TrafficLight => ({
  id,
  name: `Light ${id}`,
  lat: 4.7,
  lon: -74.2,
  state: 'green',
  greenDuration: 30,
  yellowDuration: 5,
  redDuration: 25,
  stateTimer: 0,
  ...overrides,
});

describe('simulationStore', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      vehicles: {},
      trafficLights: {},
      selectedId: null,
      selectedType: null,
      isConnected: false,
      tick: 0,
      routes: [],
      simulations: [],
      activeSimId: null,
      bbox: null,
      basemapId: 'cartoLight',
    });
  });

  it('should have correct initial state', () => {
    const s = useSimulationStore.getState();
    expect(s.vehicles).toEqual({});
    expect(s.trafficLights).toEqual({});
    expect(s.selectedId).toBeNull();
    expect(s.selectedType).toBeNull();
    expect(s.isConnected).toBe(false);
    expect(s.tick).toBe(0);
    expect(s.routes).toEqual([]);
    expect(s.simulations).toEqual([]);
    expect(s.activeSimId).toBeNull();
    expect(s.bbox).toBeNull();
    expect(s.basemapId).toBe('cartoLight');
  });

  // ── setFullState ──────────────────────────────────────────────────────────
  it('setFullState should replace vehicles, trafficLights, and tick', () => {
    const vehicles = { v1: makeVehicle('v1') };
    const lights = { l1: makeTrafficLight('l1') };
    useSimulationStore.getState().setFullState(vehicles, lights, 42);
    const s = useSimulationStore.getState();
    expect(s.vehicles).toEqual(vehicles);
    expect(s.trafficLights).toEqual(lights);
    expect(s.tick).toBe(42);
  });

  // ── applyDelta ────────────────────────────────────────────────────────────
  it('applyDelta should patch existing vehicles', () => {
    useSimulationStore.setState({ vehicles: { v1: makeVehicle('v1', { speed: 30 }) }, trafficLights: {}, tick: 0 });
    const delta: SimulationDelta = {
      vehicles: { v1: { speed: 80 } },
      trafficLights: {},
      removed: [],
      tick: 1,
      timestamp: Date.now(),
    };
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().vehicles['v1'].speed).toBe(80);
    expect(useSimulationStore.getState().tick).toBe(1);
  });

  it('applyDelta should not add vehicle if it does not already exist', () => {
    const delta: SimulationDelta = {
      vehicles: { 'new-v': { speed: 60 } },
      trafficLights: {},
      removed: [],
      tick: 2,
      timestamp: Date.now(),
    };
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().vehicles['new-v']).toBeUndefined();
  });

  it('applyDelta should patch existing traffic lights', () => {
    useSimulationStore.setState({ vehicles: {}, trafficLights: { l1: makeTrafficLight('l1', { state: 'green' }) }, tick: 0 });
    const delta: SimulationDelta = {
      vehicles: {},
      trafficLights: { l1: { state: 'red' } },
      removed: [],
      tick: 3,
      timestamp: Date.now(),
    };
    useSimulationStore.getState().applyDelta(delta);
    expect(useSimulationStore.getState().trafficLights['l1'].state).toBe('red');
  });

  it('applyDelta should remove entities in removed list', () => {
    useSimulationStore.setState({
      vehicles: { v1: makeVehicle('v1'), v2: makeVehicle('v2') },
      trafficLights: { l1: makeTrafficLight('l1') },
      tick: 0,
    });
    const delta: SimulationDelta = {
      vehicles: {},
      trafficLights: {},
      removed: ['v1', 'l1'],
      tick: 4,
      timestamp: Date.now(),
    };
    useSimulationStore.getState().applyDelta(delta);
    const s = useSimulationStore.getState();
    expect(s.vehicles['v1']).toBeUndefined();
    expect(s.vehicles['v2']).toBeDefined();
    expect(s.trafficLights['l1']).toBeUndefined();
  });

  // ── selectEntity / deselect ───────────────────────────────────────────────
  it('selectEntity should set selectedId and selectedType', () => {
    useSimulationStore.getState().selectEntity('v1', 'vehicle');
    const s = useSimulationStore.getState();
    expect(s.selectedId).toBe('v1');
    expect(s.selectedType).toBe('vehicle');
  });

  it('deselect should clear selected entity', () => {
    useSimulationStore.getState().selectEntity('l1', 'trafficLight');
    useSimulationStore.getState().deselect();
    const s = useSimulationStore.getState();
    expect(s.selectedId).toBeNull();
    expect(s.selectedType).toBeNull();
  });

  // ── setConnected ──────────────────────────────────────────────────────────
  it('setConnected should toggle isConnected', () => {
    useSimulationStore.getState().setConnected(true);
    expect(useSimulationStore.getState().isConnected).toBe(true);
    useSimulationStore.getState().setConnected(false);
    expect(useSimulationStore.getState().isConnected).toBe(false);
  });

  // ── setRoutes ─────────────────────────────────────────────────────────────
  it('setRoutes should replace routes list', () => {
    const routes: RouteInfo[] = [{ id: 'r1', name: 'Route 1' }];
    useSimulationStore.getState().setRoutes(routes);
    expect(useSimulationStore.getState().routes).toEqual(routes);
  });

  // ── setSimulationList ──────────────────────────────────────────────────────
  it('setSimulationList should replace simulations list', () => {
    const sims: SimulationSummary[] = [
      { simId: 's1', mapId: 'map1', nVehicles: 10, createdByUid: 'u1', createdByName: 'Alice', nodeId: 'n1', createdAt: 1000 },
    ];
    useSimulationStore.getState().setSimulationList(sims);
    expect(useSimulationStore.getState().simulations).toEqual(sims);
  });

  // ── setActiveSimId ─────────────────────────────────────────────────────────
  it('setActiveSimId should update activeSimId', () => {
    useSimulationStore.getState().setActiveSimId('sim-123');
    expect(useSimulationStore.getState().activeSimId).toBe('sim-123');
    useSimulationStore.getState().setActiveSimId(null);
    expect(useSimulationStore.getState().activeSimId).toBeNull();
  });

  // ── setBbox ───────────────────────────────────────────────────────────────
  it('setBbox should update bbox', () => {
    const bbox: BBox = { minLng: -74.5, minLat: 4.5, maxLng: -74.0, maxLat: 5.0 };
    useSimulationStore.getState().setBbox(bbox);
    expect(useSimulationStore.getState().bbox).toEqual(bbox);
    useSimulationStore.getState().setBbox(null);
    expect(useSimulationStore.getState().bbox).toBeNull();
  });

  // ── setBasemapId ──────────────────────────────────────────────────────────
  it('setBasemapId should update basemapId', () => {
    useSimulationStore.getState().setBasemapId('satellite');
    expect(useSimulationStore.getState().basemapId).toBe('satellite');
  });
});
