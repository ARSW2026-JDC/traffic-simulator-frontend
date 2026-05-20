import type { Vehicle, TrafficLight, SimulationStats, SimulationDelta } from '../types';

export function createVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-default',
    name: 'Vehículo Default',
    lat: 4.711,
    lon: -74.0721,
    speed: 10,
    heading: 45,
    color: '#FF0000',
    routeId: 'r1',
    waypointIndex: 0,
    status: 'moving',
    profile: 'normal',
    ...overrides,
  };
}

export function createTrafficLight(overrides: Partial<TrafficLight> = {}): TrafficLight {
  return {
    id: 'tl-default',
    name: 'Semáforo Default',
    lat: 4.711,
    lon: -74.0721,
    state: 'red',
    greenDuration: 30,
    yellowDuration: 3,
    redDuration: 30,
    stateTimer: 0,
    ...overrides,
  };
}

export function createDelta(overrides: Partial<SimulationDelta> = {}): SimulationDelta {
  return {
    vehicles: {},
    trafficLights: {},
    removed: [],
    tick: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

export function createSimStats(overrides: Partial<SimulationStats> = {}): SimulationStats {
  return {
    avgSpeed: 25,
    vehicleCount: 10,
    movingCount: 5,
    stoppedCount: 3,
    waitingCount: 2,
    redLightCount: 3,
    greenLightCount: 5,
    yellowLightCount: 2,
    totalLights: 10,
    mostCongestedEdge: {
      edgeId: 1,
      highwayType: 'primary',
      vehicleCount: 8,
      avgSpeed: 12,
      lat: 4.711,
      lng: -74.0721,
    },
    profileCounts: { aggressive: 2, normal: 5, cautious: 1, truck: 1, bus: 1 },
    tick: 100,
    timestamp: Date.now(),
    ...overrides,
  };
}
