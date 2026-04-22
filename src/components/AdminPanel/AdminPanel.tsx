import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useSimulationStore } from '../../stores/simulationStore';
import type { SimulationSummary } from '../../types';
import {
  createSimulation,
  deleteSimulationById,
  getAvailableMaps,
  getSimulationById,
  getSimulations,
} from '../../services/api';

interface Props {
  simSocket: RefObject<Socket | null>;
}

type SubTab = 'vehicles' | 'lights' | 'add' | 'simulation';

export default function AdminPanel({ simSocket }: Props) {
  const [sub, setSub] = useState<SubTab>('vehicles');

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-border shrink-0">
        {(['vehicles', 'lights', 'add', 'simulation'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex-1 py-2 text-xs capitalize transition-colors ${
              sub === t
                ? 'text-[#2258B1] border-b-2 border-[#2258B1] bg-[#f3f4f6]'
                : 'text-muted hover:text-[#2258B1]'
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
        {sub === 'simulation' && <SimulationPanel simSocket={simSocket} />}
      </div>
    </div>
  );
}

type AvailableMap = {
  id: string;
  sizeBytes: number;
  path: string;
};

function SimulationPanel({ simSocket }: { simSocket: RefObject<Socket | null> }) {
  const { bbox, setBbox } = useSimulationStore((s) => ({ bbox: s.bbox, setBbox: s.setBbox }));
  const [list, setList] = useState<SimulationSummary[]>([]);
  const [single, setSingle] = useState<SimulationSummary | null>(null);
  const [simId, setSimId] = useState('');
  const [maps, setMaps] = useState<AvailableMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [mapsError, setMapsError] = useState('');
  const [createError, setCreateError] = useState('');
  const [mapId, setMapId] = useState('');
  const [nVehicles, setNVehicles] = useState(200);
  const [importError, setImportError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [importMapId, setImportMapId] = useState('');
  const [minLng, setMinLng] = useState('');
  const [minLat, setMinLat] = useState('');
  const [maxLng, setMaxLng] = useState('');
  const [maxLat, setMaxLat] = useState('');
  const [useDriverMix, setUseDriverMix] = useState(false);
  const [aggressive, setAggressive] = useState(0.3);
  const [normal, setNormal] = useState(0.3);
  const [cautious, setCautious] = useState(0.1);
  const [truck, setTruck] = useState(0.1);
  const [bus, setBus] = useState(0.2);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSimulations();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las simulaciones activas.');
    } finally {
      setLoading(false);
    }
  };

  const loadOne = async () => {
    const value = simId.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSimulationById(value);
      setSingle(data ?? null);
    } catch {
      setSingle(null);
      setError('No se pudo cargar la simulacion solicitada.');
    } finally {
      setLoading(false);
    }
  };

  const loadMaps = async () => {
    setMapsLoading(true);
    setMapsError('');
    try {
      const data = await getAvailableMaps();
      setMaps(Array.isArray(data) ? data : []);
    } catch {
      setMapsError('No se pudieron cargar los mapas disponibles.');
    } finally {
      setMapsLoading(false);
    }
  };

  const removeSimulation = async (id: string) => {
    if (!id) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSimulationById(id);
      await loadAll();
      if (single?.simId === id) {
        setSingle(null);
      }
    } catch {
      setError('No se pudo eliminar la simulacion.');
    } finally {
      setDeletingId('');
    }
  };

  const driverMixSum = aggressive + normal + cautious + truck + bus;
  const driverMixValid = Math.abs(driverMixSum - 1) < 0.0001;

  const createNewSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapId.trim()) {
      setCreateError('Selecciona un mapa valido.');
      return;
    }
    if (useDriverMix && !driverMixValid) {
      setCreateError('DriverMix debe sumar 1.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      await createSimulation({
        mapId: mapId.trim(),
        nVehicles,
        ...(useDriverMix
          ? {
              driverMix: {
                aggressive,
                normal,
                cautious,
                truck,
                bus,
              },
            }
          : {}),
      });
      setMapId('');
      setNVehicles(200);
      setUseDriverMix(false);
      setAggressive(0.3);
      setNormal(0.3);
      setCautious(0.1);
      setTruck(0.1);
      setBus(0.2);
    } catch {
      setCreateError('No se pudo crear la simulacion.');
    } finally {
      setCreating(false);
    }
  };

  const fillFromBbox = () => {
    if (!bbox) {
      setImportError('Selecciona un area en el mapa.');
      return;
    }
    setImportError('');
    setMinLng(bbox.minLng.toFixed(6));
    setMinLat(bbox.minLat.toFixed(6));
    setMaxLng(bbox.maxLng.toFixed(6));
    setMaxLat(bbox.maxLat.toFixed(6));
  };

  const clearBbox = () => {
    setBbox(null);
    setMinLng('');
    setMinLat('');
    setMaxLng('');
    setMaxLat('');
  };

  const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const minLngValue = parseNumber(minLng);
  const minLatValue = parseNumber(minLat);
  const maxLngValue = parseNumber(maxLng);
  const maxLatValue = parseNumber(maxLat);
  const bboxValid =
    minLngValue !== null &&
    minLatValue !== null &&
    maxLngValue !== null &&
    maxLatValue !== null &&
    minLngValue < maxLngValue &&
    minLatValue < maxLatValue;

  const bboxString = bboxValid
    ? `${minLngValue},${minLatValue},${maxLngValue},${maxLatValue}`
    : 'minLng,minLat,maxLng,maxLat';
  const fileBase = importMapId.trim() || 'mapa';
  const linuxCommand = `curl "https://overpass-api.de/api/map?bbox=${bboxString}" -o ${fileBase}.osm`;
  const windowsCommand = `Invoke-WebRequest -Uri "https://overpass-api.de/api/map?bbox=${bboxString}" -OutFile "${fileBase}.osm"`;
  const goCommand = `go run scripts/preprocess/main.go --input ..\\${fileBase}.osm --output maps\\${fileBase}.msgpack --id ${fileBase}`;

  const copyCommand = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1500);
    } catch {
      setImportError('No se pudo copiar al portapapeles.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  useEffect(() => {
    loadAll();
    loadMaps();
  }, []);

  useEffect(() => {
    const socket = simSocket.current;
    if (!socket) return;

    const handleListUpdate = (data: SimulationSummary[]) => {
      const nextList = Array.isArray(data) ? data : [];
      setList(nextList);
      if (single) {
        const updated = nextList.find((item) => item.simId === single.simId) || null;
        setSingle(updated);
      }
    };

    socket.on('simulation:list-updated', handleListUpdate);

    return () => {
      socket.off('simulation:list-updated', handleListUpdate);
    };
  }, [simSocket, single]);

  return (
    <div className="p-4 space-y-4">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-black font-medium">Simulaciones activas</h3>
          <button
            onClick={loadAll}
            className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="text-xs text-muted">Cargando...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {list.length === 0 && !loading ? (
          <p className="text-xs text-muted">No hay simulaciones activas.</p>
        ) : (
          <div className="divide-y divide-border">
            {list.map((sim) => (
              <div key={sim.simId} className="py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{sim.mapId}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{sim.nVehicles} vehiculos</span>
                    <button
                      onClick={() => removeSimulation(sim.simId)}
                      disabled={deletingId === sim.simId}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === sim.simId ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted font-mono">{sim.simId}</p>
                <div className="text-xs text-muted">
                  <span>{sim.createdBy}</span>
                  <span className="mx-2">•</span>
                  <span>{sim.nodeId}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(sim.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm text-gray-600 font-medium">Buscar por simId</h3>
        <div className="flex gap-2">
          <input
            value={simId}
            onChange={(e) => setSimId(e.target.value)}
            placeholder="28eb9d16-0d7e-45d8-a1d7-9cd40da2835f"
            className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none focus:border-[#2258B1]"
          />
          <button
            onClick={loadOne}
            className="px-3 py-2 bg-[#2258B1] hover:bg-[#1a46a0] text-white text-xs font-medium rounded-lg transition-colors"
          >
            Consultar
          </button>
        </div>

        {single && (
          <div className="border border-border rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{single.mapId}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted">{single.nVehicles} vehiculos</span>
                <button
                  onClick={() => removeSimulation(single.simId)}
                  disabled={deletingId === single.simId}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                >
                  {deletingId === single.simId ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
            <p className="text-muted font-mono">{single.simId}</p>
            <div className="text-muted">
              <span>{single.createdBy}</span>
              <span className="mx-2">•</span>
              <span>{single.nodeId}</span>
              <span className="mx-2">•</span>
              <span>{new Date(single.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-gray-600 font-medium">Mapas disponibles</h3>
          <button
            onClick={loadMaps}
            className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
          >
            Refresh
          </button>
        </div>

        {mapsLoading && <p className="text-xs text-muted">Cargando...</p>}
        {mapsError && <p className="text-xs text-red-400">{mapsError}</p>}

        {maps.length === 0 && !mapsLoading ? (
          <p className="text-xs text-muted">No hay mapas disponibles.</p>
        ) : (
          <div className="divide-y divide-border">
            {maps.map((map) => (
              <div key={map.id} className="py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{map.id}</p>
                  <span className="text-xs text-muted">{formatBytes(map.sizeBytes)}</span>
                </div>
                <p className="text-xs text-muted font-mono">{map.path}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-gray-600 font-medium">Importar mapa</h3>
          <button
            type="button"
            onClick={fillFromBbox}
            className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
          >
            Usar bbox del mapa
          </button>
        </div>
        <p className="text-xs text-muted">
          Haz dos clics en el mapa para seleccionar el area (esquina 1 y esquina 2). Copia los
          comandos segun tu sistema.
        </p>
        <form className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">mapId</label>
            <input
              value={importMapId}
              onChange={(e) => setImportMapId(e.target.value)}
              placeholder="funza"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none focus:border-[#2258B1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted block mb-1">minLng</label>
              <input
                type="number"
                step="0.000001"
                value={minLng}
                onChange={(e) => setMinLng(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">minLat</label>
              <input
                type="number"
                step="0.000001"
                value={minLat}
                onChange={(e) => setMinLat(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">maxLng</label>
              <input
                type="number"
                step="0.000001"
                value={maxLng}
                onChange={(e) => setMaxLng(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">maxLat</label>
              <input
                type="number"
                step="0.000001"
                value={maxLat}
                onChange={(e) => setMaxLat(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span>{bboxValid ? 'BBox valido' : 'BBox invalido'}</span>
            <button
              type="button"
              onClick={clearBbox}
              className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
            >
              Limpiar
            </button>
          </div>

          {importError && <p className="text-xs text-red-400">{importError}</p>}
        </form>
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-muted">Linux (Ubuntu, Debian, etc.)</p>
              <button
                type="button"
                onClick={() => copyCommand(linuxCommand, 'linux')}
                className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
              >
                {copiedKey === 'linux' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-surface border border-border rounded-lg p-2 text-gray-600 overflow-auto">
              {linuxCommand}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-muted">Windows (PowerShell)</p>
              <button
                type="button"
                onClick={() => copyCommand(windowsCommand, 'windows')}
                className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
              >
                {copiedKey === 'windows' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-surface border border-border rounded-lg p-2 text-gray-600 overflow-auto">
              {windowsCommand}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-muted">Procesar con Go</p>
              <button
                type="button"
                onClick={() => copyCommand(goCommand, 'go')}
                className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
              >
                {copiedKey === 'go' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-surface border border-border rounded-lg p-2 text-gray-600 overflow-auto">
              {goCommand}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm text-gray-600 font-medium">Crear simulacion</h3>
        <form onSubmit={createNewSimulation} className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Mapa</label>
            <select
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none focus:border-[#2258B1]"
            >
              <option value="">Selecciona un mapa</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Vehiculos</label>
            <input
              type="number"
              min={1}
              value={nVehicles}
              onChange={(e) => setNVehicles(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none focus:border-[#2258B1]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={useDriverMix}
              onChange={(e) => setUseDriverMix(e.target.checked)}
              className="accent-[#2258B1]"
            />
            Usar driverMix (debe sumar 1)
          </label>

          {useDriverMix && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">Aggressive</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={aggressive}
                  onChange={(e) => setAggressive(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Normal</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={normal}
                  onChange={(e) => setNormal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Cautious</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={cautious}
                  onChange={(e) => setCautious(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Truck</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={truck}
                  onChange={(e) => setTruck(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Bus</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={bus}
                  onChange={(e) => setBus(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-gray-600 focus:outline-none"
                />
              </div>
              <div className="flex items-end text-xs text-muted">
                Suma: {driverMixSum.toFixed(2)}
              </div>
            </div>
          )}

          {createError && <p className="text-xs text-red-400">{createError}</p>}

          <button
            type="submit"
            disabled={creating || (useDriverMix && !driverMixValid)}
            className="w-full py-2 bg-[#2258B1] hover:bg-[#1a46a0] text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {creating ? 'Creando...' : 'Crear simulacion'}
          </button>
        </form>
      </section>
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
  const { vehicles, trafficLights, activeSimId } = useSimulationStore();
  const items =
    type === 'vehicle' ? Object.values(vehicles) : Object.values(trafficLights);

  const remove = (id: string) => {
    if (type === 'vehicle') {
      simSocket.current?.emit('command', {
        simId: activeSimId ?? undefined,
        type: 'remove_vehicle',
        data: { vehicleId: id },
      });
      return;
    }

    const nodeId = Number(id);
    if (!Number.isFinite(nodeId)) return;

    simSocket.current?.emit('command', {
      simId: activeSimId ?? undefined,
      type: 'remove_trafficLight',
      data: { nodeId },
    });
    return;
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-muted text-sm">No {type}s in simulation.</div>
    );
  }

  return (
    <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
      {items.map((item) => (
        <div key={item.id} className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{item.name}</p>
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
  const { activeSimId } = useSimulationStore();
  const [type, setType] = useState<'vehicle' | 'trafficLight'>('vehicle');
  const [name, setName] = useState('');
  const [count, setCount] = useState(1);
  const [profile, setProfile] = useState<'aggressive' | 'normal' | 'cautious' | 'truck' | 'bus'>(
    'normal'
  );
  const [speed, setSpeed] = useState(50);
  const [color, setColor] = useState('#3b82f6');
  const [lat, setLat] = useState(4.6534);
  const [lon, setLon] = useState(-74.0836);
  const [green, setGreen] = useState(30);
  const [yellow, setYellow] = useState(4);
  const [red, setRed] = useState(30);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSocket.current) return;

    if (type === 'vehicle') {
      const nextCount = Number.isFinite(count) ? Math.floor(count) : 1;
      simSocket.current.emit('command', {
        simId: activeSimId ?? undefined,
        type: 'add_vehicles',
        data: {
          count: nextCount > 0 ? nextCount : 1,
          profile,
          name: name || undefined,
          speed,
          color,
        },
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
              type === t ? 'bg-[#2258B1] text-white font-medium' : 'bg-surface text-muted border border-border'
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
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#2258B1]"
          placeholder="Auto-generated if empty"
        />
      </div>

      {type === 'vehicle' && (
        <>
          <div>
            <label className="text-xs text-muted block mb-1">Profile</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as typeof profile)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#2258B1]"
            >
              <option value="aggressive">Aggressive</option>
              <option value="normal">Normal</option>
              <option value="cautious">Cautious</option>
              <option value="truck">Truck</option>
              <option value="bus">Bus</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Count</label>
            <input
              type="number"
              min={1}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#2258B1]"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Speed — {speed.toFixed(2)} km/h</label>
            <input
              type="range"
              min={5}
              max={120}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-[#2258B1]"
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
              <span className="text-sm text-gray-600 font-mono">{color}</span>
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
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-gray-600 focus:outline-none"
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
        className="w-full py-2 bg-[#2258B1] hover:bg-[#1a46a0] text-white font-medium text-sm rounded-lg transition-colors"
      >
        Add {type === 'vehicle' ? 'Vehicle' : 'Traffic Light'}
      </button>
    </form>
  );
}
