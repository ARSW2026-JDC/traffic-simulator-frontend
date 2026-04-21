export type UserRole = 'GUEST' | 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  color: string;
  heading: number;
  routeId: string;
  waypointIndex: number;
  status: 'moving' | 'stopped' | 'waiting';
}

export interface TrafficLight {
  id: string;
  name: string;
  lat: number;
  lon: number;
  state: 'green' | 'yellow' | 'red';
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  stateTimer: number;
}

export interface SimulationFullState {
  vehicles: Record<string, Vehicle>;
  trafficLights: Record<string, TrafficLight>;
  tick: number;
  timestamp: number;
}

export interface SimulationDelta {
  vehicles: Record<string, Partial<Vehicle>>;
  trafficLights: Record<string, Partial<TrafficLight>>;
  removed: string[];
  tick: number;
  timestamp: number;
}

export interface SimulationSummary {
  simId: string;
  mapId: string;
  nVehicles: number;
  createdBy: string;
  nodeId: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface ChangeLogEntry {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: number;
}

export interface RouteInfo {
  id: string;
  name: string;
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}
