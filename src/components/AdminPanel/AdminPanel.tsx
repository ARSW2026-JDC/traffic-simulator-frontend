import { useState } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useSimulationStore } from '../../stores/simulationStore';

interface Props {
  simSocket: RefObject<Socket | null>;
}

type SubTab = 'vehicles' | 'lights' | 'add';

export default function AdminPanel({ simSocket }: Props) {
  const [sub, setSub] = useState<SubTab>('vehicles');

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-border shrink-0">
        {(['vehicles', 'lights', 'add'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex-1 py-2 text-xs capitalize transition-colors ${
              sub === t ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-muted hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {sub === 'vehicles' && <EntityList type="vehicle" simSocket={simSocket} />}
        {sub === 'lights' && <EntityList type="trafficLight" simSocket={simSocket} />}
        {sub === 'add' && <AddEntityForm simSocket={simSocket} />}
      </div>
    </div>
  );
}

function EntityList({
  type,
  simSocket,
}: {
  type: 'vehicle' | 'trafficLight';
  simSocket: RefObject<Socket | null>;
}) {
  const { vehicles, trafficLights } = useSimulationStore();
  const items =
    type === 'vehicle' ? Object.values(vehicles) : Object.values(trafficLights);

  const remove = (id: string) => {
    simSocket.current?.emit('entity:remove', { id });
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-muted text-sm">No {type}s in simulation.</div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-white">{item.name}</p>
            <p className="text-xs text-muted font-mono">{item.id}</p>
          </div>
          <button
            onClick={() => remove(item.id)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function AddEntityForm({ simSocket }: { simSocket: RefObject<Socket | null> }) {
  const { routes } = useSimulationStore();
  const [type, setType] = useState<'vehicle' | 'trafficLight'>('vehicle');
  const [name, setName] = useState('');
  const [speed, setSpeed] = useState(50);
  const [color, setColor] = useState('#3b82f6');
  const [routeId, setRouteId] = useState('');
  const [lat, setLat] = useState(4.6534);
  const [lon, setLon] = useState(-74.0836);
  const [green, setGreen] = useState(30);
  const [yellow, setYellow] = useState(4);
  const [red, setRed] = useState(30);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSocket.current) return;

    if (type === 'vehicle') {
      simSocket.current.emit('entity:add', {
        type: 'vehicle',
        name: name || undefined,
        speed,
        color,
        routeId: routeId || undefined,
      });
    } else {
      simSocket.current.emit('entity:add', {
        type: 'trafficLight',
        name: name || undefined,
        lat,
        lon,
        greenDuration: green * 1000,
        yellowDuration: yellow * 1000,
        redDuration: red * 1000,
      });
    }

    setName('');
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-4">
      <div className="flex gap-2">
        {(['vehicle', 'trafficLight'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 text-xs rounded transition-colors ${
              type === t ? 'bg-yellow-500 text-black font-medium' : 'bg-surface text-muted border border-border'
            }`}
          >
            {t === 'vehicle' ? 'Vehicle' : 'Traffic Light'}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-muted block mb-1">Name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500"
          placeholder="Auto-generated if empty"
        />
      </div>

      {type === 'vehicle' && (
        <>
          <div>
            <label className="text-xs text-muted block mb-1">Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="">Default route</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Speed — {speed} km/h</label>
            <input
              type="range"
              min={5}
              max={120}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded border border-border bg-surface cursor-pointer"
              />
              <span className="text-sm text-white font-mono">{color}</span>
            </div>
          </div>
        </>
      )}

      {type === 'trafficLight' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted block mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Green duration — {green}s</label>
            <input type="range" min={2} max={120} value={green} onChange={(e) => setGreen(Number(e.target.value))} className="w-full accent-green-500" />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Yellow duration — {yellow}s</label>
            <input type="range" min={1} max={30} value={yellow} onChange={(e) => setYellow(Number(e.target.value))} className="w-full accent-yellow-400" />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Red duration — {red}s</label>
            <input type="range" min={2} max={120} value={red} onChange={(e) => setRed(Number(e.target.value))} className="w-full accent-red-500" />
          </div>
        </>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium text-sm rounded-lg transition-colors"
      >
        Add {type === 'vehicle' ? 'Vehicle' : 'Traffic Light'}
      </button>
    </form>
  );
}
