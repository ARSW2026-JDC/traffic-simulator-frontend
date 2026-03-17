import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useSimulationStore } from '../../stores/simulationStore';
import { useAuthStore } from '../../stores/authStore';
import type { Vehicle, TrafficLight } from '../../types';

interface Props {
  simSocket: RefObject<Socket | null>;
}

export default function ControlPanel({ simSocket }: Props) {
  const { selectedId, selectedType, vehicles, trafficLights, deselect } = useSimulationStore();
  const { user } = useAuthStore();
  const canEdit = user?.role === 'USER' || user?.role === 'ADMIN';

  const entity =
    selectedId && selectedType === 'vehicle'
      ? vehicles[selectedId]
      : selectedId && selectedType === 'trafficLight'
        ? trafficLights[selectedId]
        : null;

  if (!entity) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-muted text-sm">Click on a vehicle or traffic light on the map to select it.</p>
        {!canEdit && (
          <p className="text-xs text-slate-500 mt-2">Guest mode — view only.</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">{entity.name}</h3>
          <p className="text-xs text-muted capitalize">{selectedType}</p>
        </div>
        <button
          onClick={deselect}
          className="text-muted hover:text-white text-xs transition-colors"
        >
          Deselect
        </button>
      </div>

      {selectedType === 'vehicle' && (
        <VehicleControls vehicle={entity as Vehicle} simSocket={simSocket} canEdit={canEdit} />
      )}
      {selectedType === 'trafficLight' && (
        <LightControls light={entity as TrafficLight} simSocket={simSocket} canEdit={canEdit} />
      )}
    </div>
  );
}

function VehicleControls({
  vehicle,
  simSocket,
  canEdit,
}: {
  vehicle: Vehicle;
  simSocket: RefObject<Socket | null>;
  canEdit: boolean;
}) {
  const [speed, setSpeed] = useState(vehicle.speed);
  const [color, setColor] = useState(vehicle.color);

  useEffect(() => {
    setSpeed(vehicle.speed);
    setColor(vehicle.color);
  }, [vehicle.id]);

  const apply = () => {
    simSocket.current?.emit('vehicle:update', { id: vehicle.id, speed, color });
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-lg p-3 space-y-1">
        <p className="text-xs text-muted">Status</p>
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
          <span className="text-sm text-white capitalize">{vehicle.status}</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted block mb-2">
          Speed — <span className="text-white">{speed} km/h</span>
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
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>5</span>
          <span>120 km/h</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted block mb-2">Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            disabled={!canEdit}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-border bg-surface"
          />
          <span className="text-sm text-white font-mono">{color}</span>
        </div>
      </div>

      {canEdit && (
        <button
          onClick={apply}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
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
}: {
  light: TrafficLight;
  simSocket: RefObject<Socket | null>;
  canEdit: boolean;
}) {
  const [green, setGreen] = useState(light.greenDuration / 1000);
  const [yellow, setYellow] = useState(light.yellowDuration / 1000);
  const [red, setRed] = useState(light.redDuration / 1000);

  useEffect(() => {
    setGreen(light.greenDuration / 1000);
    setYellow(light.yellowDuration / 1000);
    setRed(light.redDuration / 1000);
  }, [light.id]);

  const apply = () => {
    simSocket.current?.emit('light:update', {
      id: light.id,
      greenDuration: green * 1000,
      yellowDuration: yellow * 1000,
      redDuration: red * 1000,
    });
  };

  const stateColors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-lg p-3 flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${stateColors[light.state]}`} />
        <div>
          <p className="text-sm text-white capitalize">{light.state}</p>
          <p className="text-xs text-muted">{Math.round(light.stateTimer / 1000)}s elapsed</p>
        </div>
      </div>

      {(
        [
          { label: 'Green duration', value: green, set: setGreen, color: 'accent-green-500' },
          { label: 'Yellow duration', value: yellow, set: setYellow, color: 'accent-yellow-500' },
          { label: 'Red duration', value: red, set: setRed, color: 'accent-red-500' },
        ] as const
      ).map(({ label, value, set, color }) => (
        <div key={label}>
          <label className="text-xs text-muted block mb-2">
            {label} — <span className="text-white">{value}s</span>
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
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>2s</span>
            <span>120s</span>
          </div>
        </div>
      ))}

      {canEdit && (
        <button
          onClick={apply}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          Apply Changes
        </button>
      )}
    </div>
  );
}
