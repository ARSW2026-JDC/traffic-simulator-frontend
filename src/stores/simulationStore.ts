import { create } from 'zustand';
import type {
  Vehicle,
  TrafficLight,
  SimulationDelta,
  RouteInfo,
  SimulationSummary,
  BBox,
} from '../types';

interface SimulationStore {
  vehicles: Record<string, Vehicle>;
  trafficLights: Record<string, TrafficLight>;
  selectedId: string | null;
  selectedType: 'vehicle' | 'trafficLight' | null;
  isConnected: boolean;
  tick: number;
  routes: RouteInfo[];
  simulations: SimulationSummary[];
  activeSimId: string | null;
  bbox: BBox | null;
  basemapId: string;
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
  setSimulationList: (list: SimulationSummary[]) => void;
  setActiveSimId: (simId: string | null) => void;
  setBbox: (bbox: BBox | null) => void;
  setBasemapId: (basemapId: string) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
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
  setSimulationList: (simulations) => set({ simulations }),
  setActiveSimId: (activeSimId) => set({ activeSimId }),
  setBbox: (bbox) => set({ bbox }),
  setBasemapId: (basemapId) => set({ basemapId }),
}));
