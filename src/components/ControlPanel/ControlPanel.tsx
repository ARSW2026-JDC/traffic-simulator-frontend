import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useSimulationStore } from '../../stores/simulationStore';
import { useAuthStore } from '../../stores/authStore';
import type { Vehicle, TrafficLight } from '../../types';
import { BASEMAPS, DEFAULT_BASEMAP_ID } from '../MapView/basemaps';

interface Props {
  simSocket: RefObject<Socket | null>;
}

export default function ControlPanel({ simSocket }: Props) {
  const {
    selectedId,
    selectedType,
    vehicles,
    trafficLights,
    deselect,
    simulations,
    activeSimId,
    setActiveSimId,
    setFullState,
    setRoutes,
    basemapId,
    setBasemapId,
  } = useSimulationStore();
  const { user } = useAuthStore();
  const canEdit = user?.role === 'USER' || user?.role === 'ADMIN';

  const basemapStorageKey = `map:basemap:${user?.id ?? 'guest'}`;

  useEffect(() => {
    const saved = localStorage.getItem(basemapStorageKey);
    if (saved && BASEMAPS.some((entry) => entry.id === saved)) {
      setBasemapId(saved);
      return;
    }
    setBasemapId(DEFAULT_BASEMAP_ID);
  }, [basemapStorageKey, setBasemapId]);

  const entity =
    selectedId && selectedType === 'vehicle'
      ? vehicles[selectedId]
      : selectedId && selectedType === 'trafficLight'
        ? trafficLights[selectedId]
        : null;

  const requestList = () => {
    simSocket.current?.emit('sync:request');
  };

  const selectSimulation = (simId: string) => {
    if (!simId) {
      setActiveSimId(null);
      setFullState({}, {}, 0);
      setRoutes([]);
      deselect();
      return;
    }

    setActiveSimId(simId);
    setFullState({}, {}, 0);
    setRoutes([]);
    deselect();
    simSocket.current?.emit('sync:request', { simId });
    simSocket.current?.emit('routes:request');
  };

  const handleBasemapChange = (value: string) => {
    setBasemapId(value);
    localStorage.setItem(basemapStorageKey, value);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-[var(--s-text)] font-medium">Simulacion</h3>
          <button
            onClick={requestList}
            className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
          >
            Actualizar
          </button>
        </div>
        <select
          value={activeSimId ?? ''}
          onChange={(e) => selectSimulation(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-[var(--s-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none focus:border-[var(--s-blue)]"
        >
          <option value="">Sin simulacion</option>
          {simulations.map((sim) => (
            <option key={sim.simId} value={sim.simId}>
              {sim.mapId} · {sim.nVehicles} vehiculos
            </option>
          ))}
        </select>
        {simulations.length === 0 && (
          <p className="text-xs text-[var(--s-sub)]">No hay simulaciones activas.</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-[var(--s-text)] font-medium">Mapa base</h3>
        <select
          value={basemapId}
          onChange={(e) => handleBasemapChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-[var(--s-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none focus:border-[var(--s-blue)]"
        >
          {BASEMAPS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {!entity ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-[var(--s-sub)] text-sm">Click on a vehicle or traffic light on the map to select it.</p>
          {!canEdit && (
              <p className="text-xs text-[var(--s-sub)] mt-2">Guest mode — view only.</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
               <h3 className="font-medium text-[var(--s-text)] text-sm">{entity.name}</h3>
              <p className="text-xs text-[var(--s-sub)] capitalize">{selectedType}</p>
            </div>
            <button
              onClick={deselect}
              className="text-[var(--s-sub)] hover:text-[var(--s-text)] text-xs transition-colors"
            >
              Deselect
            </button>
          </div>

          {selectedType === 'vehicle' && (
            <VehicleControls
              vehicle={entity as Vehicle}
              simSocket={simSocket}
              canEdit={canEdit}
              activeSimId={activeSimId}
            />
          )}
          {selectedType === 'trafficLight' && (
            <LightControls
              light={entity as TrafficLight}
              simSocket={simSocket}
              canEdit={canEdit}
              activeSimId={activeSimId}
            />
          )}
        </>
      )}
    </div>
  );
}

function VehicleControls({
  vehicle,
  simSocket,
  canEdit,
  activeSimId,
}: {
  vehicle: Vehicle;
  simSocket: RefObject<Socket | null>;
  canEdit: boolean;
  activeSimId: string | null;
}) {
  const [speed, setSpeed] = useState(vehicle.speed);
  const [color, setColor] = useState(vehicle.color);
  const [profile, setProfile] = useState<'aggressive' | 'normal' | 'cautious' | 'truck' | 'bus'>(
    (vehicle as any).profile ?? 'normal'
  );

  useEffect(() => {
    setSpeed(vehicle.speed);
    setColor(vehicle.color);
    setProfile((vehicle as any).profile ?? 'normal');
  }, [vehicle.id]);

  const apply = () => {
    simSocket.current?.emit('command', {
      simId: activeSimId ?? undefined,
      type: 'edit_vehicle',
      data: {
        vehicleId: vehicle.id,
        speed,
        color,
        profile,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-[var(--s-gray)] rounded-lg p-3 space-y-1">
        <p className="text-xs text-[var(--s-sub)]">Status</p>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              vehicle.status === 'moving'
                ? 'bg-green-400'
                : vehicle.status === 'waiting'
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
            }`}
          />
          <span className="text-sm text-[var(--s-text)] capitalize">{vehicle.status}</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--s-sub)] block mb-2">
          Speed — <span className="text-[var(--s-text)]">{speed.toFixed(2)} km/h</span>
        </label>
        <input
          type="range"
          min={5}
          max={120}
          value={speed}
          disabled={!canEdit}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-[var(--s-sub)] mt-1">
          <span>5</span>
          <span>120 km/h</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--s-sub)] block mb-2">Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            disabled={!canEdit}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-[var(--s-border)] bg-white"
          />
          <span className="text-sm text-[var(--s-text)] font-mono">{color}</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--s-sub)] block mb-2">Profile</label>
        <select
          value={profile}
          disabled={!canEdit}
          onChange={(e) => setProfile(e.target.value as typeof profile)}
          className="w-full px-3 py-2 bg-white border border-[var(--s-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none focus:border-[var(--s-blue)]"
        >
          <option value="aggressive">Aggressive</option>
          <option value="normal">Normal</option>
          <option value="cautious">Cautious</option>
          <option value="truck">Truck</option>
          <option value="bus">Bus</option>
        </select>
      </div>

      {canEdit && (
        <button
          onClick={apply}
          className="w-full py-2 bg-[#2258B1] hover:bg-[#1a46a0] text-white font-medium text-xs rounded-lg transition-colors"
        >
          Apply Changes
        </button>
      )}
    </div>
  );
}

function LightControls({
  light,
  simSocket,
  canEdit,
  activeSimId,
}: {
  light: TrafficLight;
  simSocket: RefObject<Socket | null>;
  canEdit: boolean;
  activeSimId: string | null;
}) {
  const [green, setGreen] = useState(light.greenDuration);
  const [yellow, setYellow] = useState(light.yellowDuration);
  const [red, setRed] = useState(light.redDuration);
  const [phase, setPhase] = useState<number | ''>('');

  useEffect(() => {
    setGreen(light.greenDuration);
    setYellow(light.yellowDuration);
    setRed(light.redDuration);
    setPhase('');
  }, [light.id, light.greenDuration, light.yellowDuration, light.redDuration]);

  const apply = () => {
    const nodeId = Number(light.id);
    if (!Number.isFinite(nodeId)) return;

    const data: {
      nodeId: number;
      phase?: number;
      greenMs?: number;
      yellowMs?: number;
      redMs?: number;
    } = { nodeId };

    if (phase !== '') {
      data.phase = phase;
    }

    const greenMs = Math.round(green * 1000);
    const yellowMs = Math.round(yellow * 1000);
    const redMs = Math.round(red * 1000);

    if (greenMs > 0) data.greenMs = greenMs;
    if (yellowMs > 0) data.yellowMs = yellowMs;
    if (redMs > 0) data.redMs = redMs;

    simSocket.current?.emit('command', {
      simId: activeSimId ?? undefined,
      type: 'edit_light',
      data,
    });
  };

  const stateColors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-5">
      <div className="bg-[var(--s-gray)] rounded-lg p-3 flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${stateColors[light.state]}`} />
        <div>
          <p className="text-sm text-[var(--s-text)] capitalize">{light.state}</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--s-sub)] block mb-2">Phase (optional)</label>
        <select
          value={phase}
          disabled={!canEdit}
          onChange={(e) =>
            setPhase(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full px-3 py-2 bg-white border border-[var(--s-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none focus:border-[var(--s-blue)]"
        >
          <option value="">No change</option>
          <option value={0}>Green (0)</option>
          <option value={1}>Yellow (1)</option>
          <option value={2}>Red (2)</option>
        </select>
      </div>

      {(
        [
          { label: 'Green duration', value: green, set: setGreen, color: 'accent-green-500' },
          { label: 'Yellow duration', value: yellow, set: setYellow, color: 'accent-yellow-500' },
          { label: 'Red duration', value: red, set: setRed, color: 'accent-red-500' },
        ] as const
      ).map(({ label, value, set, color }) => (
        <div key={label}>
          <label className="text-xs text-[var(--s-sub)] block mb-2">
            {label} — <span className="text-[var(--s-text)]">{value}s</span>
          </label>
          <input
            type="range"
            min={2}
            max={120}
            value={value}
            disabled={!canEdit}
            onChange={(e) => (set as any)(Number(e.target.value))}
            className={`w-full ${color}`}
          />
          <div className="flex justify-between text-xs text-[var(--s-sub)] mt-1">
            <span>2s</span>
            <span>120s</span>
          </div>
        </div>
      ))}

      {canEdit && (
        <button
          onClick={apply}
          className="w-full py-2 bg-[#2258B1] hover:bg-[#1a46a0] text-white font-medium text-xs rounded-lg transition-colors"
        >
          Apply Changes
        </button>
      )}
    </div>
  );
}
