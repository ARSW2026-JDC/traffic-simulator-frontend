import { create } from 'zustand';
import type {
  Vehicle,
  TrafficLight,
  SimulationDelta,
  RouteInfo,
  SimulationSummary,
  BBox,
  SimulationStats,
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
  leftPanelTab: 'control' | 'admin';
  addMode: 'vehicle' | 'trafficLight' | null;
  clickPosition: { lat: number; lng: number } | null;
  errorMessage: string | null;
  simStats: SimulationStats | null;
  highlightPosition: { lat: number; lng: number } | null;
  setSimStats: (stats: SimulationStats | null) => void;
  setHighlightPosition: (pos: { lat: number; lng: number } | null) => void;
  setLeftPanelTab: (tab: 'control' | 'admin') => void;
  setFullState: (
    vehicles: Record<string, Vehicle>,
    trafficLights: Record<string, TrafficLight>,
    tick: number,
  ) => void;
  receiveFullState: (
    simId: string,
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
  setAddMode: (mode: 'vehicle' | 'trafficLight' | null) => void;
  setClickPosition: (pos: { lat: number; lng: number } | null) => void;
  setErrorMessage: (message: string | null) => void;
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
  leftPanelTab: 'control',
  addMode: null,
  clickPosition: null,
  errorMessage: null,
  simStats: null,
  highlightPosition: null,

  setFullState: (vehicles, trafficLights, tick) =>
    set({ vehicles, trafficLights, tick, simStats: null }),
  receiveFullState: (simId, vehicles, trafficLights, tick) =>
    set({ fullStateSimId: simId, vehicles, trafficLights, tick, simStats: null }),

  setSimStats: (simStats) => set({ simStats }),
  setHighlightPosition: (highlightPosition) => set({ highlightPosition }),

  applyDelta: (delta) =>
    set((state) => {
      if (delta.tick !== undefined && delta.tick <= state.tick) return state;

      const vehicles = { ...state.vehicles };
      const trafficLights = { ...state.trafficLights };

      for (const [id, patch] of Object.entries(delta.vehicles)) {
        vehicles[id] = { ...(vehicles[id] as Partial<Vehicle>), ...patch } as Vehicle;
      }
      for (const [id, patch] of Object.entries(delta.trafficLights)) {
        trafficLights[id] = { ...(trafficLights[id] as Partial<TrafficLight>), ...patch } as TrafficLight;
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
  setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),
  setAddMode: (addMode) => set({ addMode }),
  setClickPosition: (clickPosition) => set({ clickPosition }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));
