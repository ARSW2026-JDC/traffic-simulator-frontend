import { create } from 'zustand';
import type { Vehicle, TrafficLight, SimulationDelta, RouteInfo } from '../types';

interface SimulationStore {
  vehicles: Record<string, Vehicle>;
  trafficLights: Record<string, TrafficLight>;
  selectedId: string | null;
  selectedType: 'vehicle' | 'trafficLight' | null;
  isConnected: boolean;
  tick: number;
  routes: RouteInfo[];
  setFullState: (
    vehicles: Record<string, Vehicle>,
    trafficLights: Record<string, TrafficLight>,
    tick: number,
  ) => void;
  applyDelta: (delta: SimulationDelta) => void;
  selectEntity: (id: string, type: 'vehicle' | 'trafficLight') => void;
  deselect: () => void;
  setConnected: (v: boolean) => void;
  setRoutes: (routes: RouteInfo[]) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  vehicles: {},
  trafficLights: {},
  selectedId: null,
  selectedType: null,
  isConnected: false,
  tick: 0,
  routes: [],

  setFullState: (vehicles, trafficLights, tick) => set({ vehicles, trafficLights, tick }),

  applyDelta: (delta) =>
    set((state) => {
      const vehicles = { ...state.vehicles };
      const trafficLights = { ...state.trafficLights };

      for (const [id, patch] of Object.entries(delta.vehicles)) {
        if (vehicles[id]) {
          vehicles[id] = { ...vehicles[id], ...patch } as Vehicle;
        }
      }
      for (const [id, patch] of Object.entries(delta.trafficLights)) {
        if (trafficLights[id]) {
          trafficLights[id] = { ...trafficLights[id], ...patch } as TrafficLight;
        }
      }
      for (const id of delta.removed) {
        delete vehicles[id];
        delete trafficLights[id];
      }

      return { vehicles, trafficLights, tick: delta.tick };
    }),

  selectEntity: (selectedId, selectedType) => set({ selectedId, selectedType }),
  deselect: () => set({ selectedId: null, selectedType: null }),
  setConnected: (isConnected) => set({ isConnected }),
  setRoutes: (routes) => set({ routes }),
}));
