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

const subTabLabels: Record<SubTab, string> = {
  vehicles: 'Vehículos',
  lights: 'Semáforos',
  add: 'Agregar',
  simulation: 'Simulación',
};

export default function AdminPanel({ simSocket }: Props) {
  const [sub, setSub] = useState<SubTab>('vehicles');

  return (
    <div className="h-full flex flex-col bg-[var(--s-white)] dark:bg-[var(--s-white)]">
      <div className="flex border-b border-[var(--s-border)] shrink-0">
{(['vehicles', 'lights', 'add', 'simulation'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex-1 py-2 text-xs capitalize transition-colors ${
              sub === t
                ? 'text-[#2258B1] dark:text-[#60a5fa] border-b-2 border-[#2258B1] dark:border-[#60a5fa] bg-[#f3f4f6] dark:bg-[#374151]'
                : 'text-[var(--s-sub)] dark:text-[#9ca3af] hover:text-[#2258B1] dark:hover:text-[#60a5fa] hover:bg-[#f3f4f6] dark:hover:bg-[#374151]'
            }`}
          >
            {subTabLabels[t]}
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
      setError('No se pudo cargar la simulación solicitada.');
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
    if (!confirm('¿Eliminar esta simulación?\nEsta acción no se puede deshacer.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSimulationById(id);
      await loadAll();
      if (single?.simId === id) {
        setSingle(null);
      }
    } catch {
      setError('No se pudo eliminar la simulación.');
    } finally {
      setDeletingId('');
    }
  };

  const driverMixSum = aggressive + normal + cautious + truck + bus;
  const driverMixValid = Math.abs(driverMixSum - 1) < 0.0001;

  const createNewSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapId.trim()) {
      setCreateError('Selecciona un mapa válido.');
      return;
    }
    if (useDriverMix && !driverMixValid) {
      setCreateError('La mezcla de conductores debe sumar 1.');
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
    } catch (err: unknown) {
      const axiosErr = err as any;
      let message = 'No se pudo crear la simulación.';
      if (axiosErr.response?.data?.message) {
        message = Array.isArray(axiosErr.response.data.message)
          ? axiosErr.response.data.message[0]
          : axiosErr.response.data.message;
      } else if (axiosErr.response?.data) {
        message = typeof axiosErr.response.data === 'string'
          ? axiosErr.response.data
          : axiosErr.response.data.message || 'No se pudo crear la simulación.';
      } else if (axiosErr.message) {
        message = axiosErr.message;
      }
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  const fillFromBbox = () => {
    if (!bbox) {
      setImportError('Selecciona un área en el mapa.');
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
          <h3 className="text-sm text-black dark:text-[var(--s-text)] font-medium">Simulaciones activas</h3>
          <button
            onClick={loadAll}
            className="text-[#2258B1] hover:text-[#1a46a0] transition-colors p-1 rounded"
            title="Actualizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        {loading && <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#2258B1] rounded-full border-t-2 border-transparent animate-spin" /><span className="text-xs text-[var(--s-sub)]">Cargando...</span></div>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {list.length === 0 && !loading ? (
          <p className="text-xs text-[var(--s-sub)]">No hay simulaciones activas.</p>
        ) : (
          <div className="divide-y divide-[var(--s-border)]">
            {list.map((sim) => (
              <div key={sim.simId} className="py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--s-text)]">{sim.mapId}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--s-sub)]">{sim.nVehicles} vehículos</span>
                    <button
                      onClick={() => removeSimulation(sim.simId)}
                      disabled={deletingId === sim.simId}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors p-1 rounded"
                      title="Eliminar simulación"
                    >
                      {deletingId === sim.simId ? (
                        <span className="text-xs">Eliminando...</span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--s-sub)] font-mono">{sim.simId}</p>
                <div className="text-xs text-[var(--s-sub)]">
                  <span>{sim.createdByName || sim.createdByUid}</span>
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
        <h3 className="text-sm text-[var(--s-text)] font-medium">Buscar por simId</h3>
        <div className="flex gap-2">
          <input
            value={simId}
            onChange={(e) => setSimId(e.target.value)}
            placeholder="28eb9d16-0d7e-45d8-a1d7-9cd40da2835f"
            className="flex-1 px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
          />
          <button
            onClick={loadOne}
            className="px-3 py-2 bg-[#2258B1] dark:bg-[#3B82F6] hover:bg-[#1a46a0] dark:hover:bg-[#2563eb] text-white text-xs font-medium rounded-lg transition-colors"
          >
            Consultar
          </button>
        </div>

        {single && (
          <div className="border border-[var(--s-border)] rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--s-text)]">{single.mapId}</p>
              <div className="flex items-center gap-2">
                <span className="text-[var(--s-sub)]">{single.nVehicles} vehículos</span>
                <button
                  onClick={() => removeSimulation(single.simId)}
                  disabled={deletingId === single.simId}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                >
                  {deletingId === single.simId ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
            <p className="text-[var(--s-sub)] font-mono">{single.simId}</p>
            <div className="text-[var(--s-sub)]">
              <span>{single.createdByName || single.createdByUid}</span>
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
          <h3 className="text-sm text-[var(--s-text)] font-medium">Mapas disponibles</h3>
          <button
            onClick={loadMaps}
            className="text-[#2258B1] hover:text-[#1a46a0] transition-colors p-1 rounded"
            title="Actualizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        {mapsLoading && <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#2258B1] rounded-full border-t-2 border-transparent animate-spin" /><span className="text-xs text-[var(--s-sub)]">Cargando...</span></div>}
        {mapsError && <p className="text-xs text-red-400">{mapsError}</p>}

        {maps.length === 0 && !mapsLoading ? (
          <p className="text-xs text-[var(--s-sub)]">No hay mapas disponibles.</p>
        ) : (
          <div className="divide-y divide-[var(--s-border)]">
            {maps.map((map) => (
              <div key={map.id} className="py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--s-text)]">{map.id}</p>
                  <span className="text-xs text-[var(--s-sub)]">{formatBytes(map.sizeBytes)}</span>
                </div>
                <p className="text-xs text-[var(--s-sub)] font-mono">{map.path}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="space-y-2 group">
        <summary className="text-sm font-medium text-[var(--s-text)] cursor-pointer list-none flex items-center gap-2 p-1 rounded hover:bg-[var(--s-gray)] transition-colors">
          <span className="text-xs transition-transform group-open:rotate-90">▶</span>{' '}
          Importar mapa
        </summary>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={fillFromBbox}
            className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
          >
            Usar bbox del mapa
          </button>
        </div>
        <p className="text-xs text-[var(--s-sub)]">
          Haz dos clics en el mapa para seleccionar el area (esquina 1 y esquina 2). Copia los
          comandos segun tu sistema.
        </p>
        <form className="space-y-3">
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">mapId</label>
            <input
              value={importMapId}
              onChange={(e) => setImportMapId(e.target.value)}
              placeholder="Nombre del mapa sin extension"
              className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--s-sub)] block mb-1">minLng</label>
              <input
                type="number"
                step="0.000001"
                value={minLng}
                onChange={(e) => setMinLng(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--s-sub)] block mb-1">minLat</label>
              <input
                type="number"
                step="0.000001"
                value={minLat}
                onChange={(e) => setMinLat(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--s-sub)] block mb-1">maxLng</label>
              <input
                type="number"
                step="0.000001"
                value={maxLng}
                onChange={(e) => setMaxLng(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--s-sub)] block mb-1">maxLat</label>
              <input
                type="number"
                step="0.000001"
                value={maxLat}
                onChange={(e) => setMaxLat(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--s-sub)]">
            <span>{bboxValid ? 'Área válida' : 'Área inválida'}</span>
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
              <p className="text-[var(--s-sub)]">Linux (Ubuntu, Debian, etc.)</p>
              <button
                type="button"
                onClick={() => copyCommand(linuxCommand, 'linux')}
                className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
              >
                {copiedKey === 'linux' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-[var(--s-gray)] border border-[var(--s-border)] rounded-lg p-2 text-[var(--s-text)] overflow-auto">
              {linuxCommand}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[var(--s-sub)]">Windows (PowerShell)</p>
              <button
                type="button"
                onClick={() => copyCommand(windowsCommand, 'windows')}
                className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
              >
                {copiedKey === 'windows' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-[var(--s-gray)] border border-[var(--s-border)] rounded-lg p-2 text-[var(--s-text)] overflow-auto">
              {windowsCommand}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[var(--s-sub)]">Procesar con Go</p>
              <button
                type="button"
                onClick={() => copyCommand(goCommand, 'go')}
                className="text-xs text-[#2258B1] hover:text-[#1a46a0] transition-colors"
              >
                {copiedKey === 'go' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-[var(--s-gray)] border border-[var(--s-border)] rounded-lg p-2 text-[var(--s-text)] overflow-auto">
              {goCommand}
            </pre>
          </div>
        </div>
      </div>
      </details>

      <section className="space-y-2">
        <h3 className="text-sm text-[var(--s-text)] font-medium">Crear simulación</h3>
        <form onSubmit={createNewSimulation} className="space-y-3">
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Mapa</label>
            <select
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
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
            <label className="text-xs text-[var(--s-sub)] block mb-1">Vehículos</label>
            <input
              type="number"
              min={1}
              value={nVehicles}
              onChange={(e) => setNVehicles(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--s-sub)]">
            <input
              type="checkbox"
              checked={useDriverMix}
              onChange={(e) => setUseDriverMix(e.target.checked)}
              className="accent-[#2258B1]"
            />
            Usar mezcla de conductores (debe sumar 1)
          </label>

          {useDriverMix && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[var(--s-sub)] block mb-1">Agresivo</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={aggressive}
                  onChange={(e) => setAggressive(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--s-sub)] block mb-1">Normal</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={normal}
                  onChange={(e) => setNormal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--s-sub)] block mb-1">Cauteloso</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={cautious}
                  onChange={(e) => setCautious(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--s-sub)] block mb-1">Camión</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={truck}
                  onChange={(e) => setTruck(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--s-sub)] block mb-1">Autobús</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={bus}
                  onChange={(e) => setBus(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-xs text-[var(--s-text)] focus:outline-none"
                />
              </div>
              <div className="flex items-end text-xs text-[var(--s-sub)]">
                Suma: {driverMixSum.toFixed(2)}
              </div>
            </div>
          )}

          {createError && <p className="text-xs text-red-400">{createError}</p>}

          <button
            type="submit"
            disabled={creating || (useDriverMix && !driverMixValid)}
            className="w-full py-2 bg-[#2258B1] dark:bg-[#3B82F6] hover:bg-[#1a46a0] dark:hover:bg-[#2563eb] text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {creating ? 'Creando...' : 'Crear simulación'}
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
  const { vehicles, trafficLights, activeSimId, selectEntity, setLeftPanelTab } =
    useSimulationStore();
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
      <div className="p-4 text-center text-[var(--s-sub)] text-sm">No hay {type === 'vehicle' ? 'vehículos' : 'semáforos'} en la simulación.</div>
    );
  }

  return (
    <div className="divide-y divide-[var(--s-border)] border-y border-[var(--s-border)]">
      {items.map((item) => (
        <div
          key={item.id}
          className="px-4 py-3 flex items-center justify-between hover:bg-[var(--s-hover)] transition-colors"
        >
          <div>
            <p className="text-sm text-[var(--s-text)]">{item.name}</p>
            <p className="text-xs text-[var(--s-sub)] font-mono">{item.id}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { selectEntity(item.id, type); setLeftPanelTab('control'); }}
              className="text-[#2258B1] hover:text-[#1a46a0] transition-colors p-1 rounded"
              title="Editar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); remove(item.id); }}
              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
              title="Eliminar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddEntityForm({ simSocket }: { simSocket: RefObject<Socket | null> }) {
  const { activeSimId, addMode, setAddMode, clickPosition, setClickPosition } = useSimulationStore();
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
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = simSocket.current;
    if (!socket) return;
    const onError = (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    };
    socket.on('error', onError);
    return () => { socket.off('error', onError); };
  }, [simSocket]);

  useEffect(() => {
    if (type === 'trafficLight' && addMode !== 'trafficLight') {
      setAddMode('trafficLight');
    } else if (type !== 'trafficLight' && addMode === 'trafficLight') {
      setAddMode(null);
      setClickPosition(null);
    }
  }, [type, addMode, setAddMode, setClickPosition]);

  useEffect(() => {
    if (clickPosition) {
      setLat(clickPosition.lat);
      setLon(clickPosition.lng);
    }
  }, [clickPosition]);

  const toggleMapMode = () => {
    if (addMode === 'trafficLight') {
      setAddMode(null);
    } else {
      setAddMode('trafficLight');
    }
  };

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
      simSocket.current.emit('command', {
        simId: activeSimId ?? undefined,
        type: 'add_traffic_light',
        data: {
          lat,
          lon,
          name: name || undefined,
          greenMs: green * 1000,
          yellowMs: yellow * 1000,
          redMs: red * 1000,
        },
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
               type === t ? 'bg-[#2258B1] dark:bg-[#3B82F6] text-white font-medium' : 'bg-white dark:bg-[var(--s-input-bg)] text-[var(--s-sub)] border border-[var(--s-border)] dark:border-[var(--s-input-border)]'
             }`}
          >
            {t === 'vehicle' ? 'Vehículo' : 'Semáforo'}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-[var(--s-sub)] block mb-1">Nombre (opcional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
          placeholder="Se genera automáticamente si está vacío"
        />
      </div>

      {type === 'vehicle' && (
        <>
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Perfil</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as typeof profile)}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
            >
              <option value="aggressive">Agresivo</option>
              <option value="normal">Normal</option>
              <option value="cautious">Cauteloso</option>
              <option value="truck">Camión</option>
              <option value="bus">Autobús</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none focus:border-[#2258B1]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Velocidad — {speed.toFixed(2)} km/h</label>
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
            <label className="text-xs text-[var(--s-sub)] block mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded border border-[var(--s-border)] dark:border-[var(--s-input-border)] bg-white dark:bg-[var(--s-input-bg)] cursor-pointer"
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
              <label className="text-xs text-[var(--s-sub)] block mb-1">Latitud</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--s-sub)] block mb-1">Longitud</label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-[var(--s-input-bg)] border border-[var(--s-border)] dark:border-[var(--s-input-border)] rounded-lg text-sm text-[var(--s-text)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Duración verde — {green}s</label>
            <input type="range" min={2} max={120} value={green} onChange={(e) => setGreen(Number(e.target.value))} className="w-full accent-green-500" />
          </div>
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Duración amarillo — {yellow}s</label>
            <input type="range" min={1} max={30} value={yellow} onChange={(e) => setYellow(Number(e.target.value))} className="w-full accent-yellow-400" />
          </div>
          <div>
            <label className="text-xs text-[var(--s-sub)] block mb-1">Duración rojo — {red}s</label>
            <input type="range" min={2} max={120} value={red} onChange={(e) => setRed(Number(e.target.value))} className="w-full accent-red-500" />
          </div>
          <div className="bg-[#f0f7ff] dark:bg-[#1E3A5F] border border-[#2258B1] dark:border-[#3B82F6] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#2258B1]">
                {clickPosition
                  ? `📍 Seleccionado: ${clickPosition.lat.toFixed(5)}, ${clickPosition.lng.toFixed(5)}`
                  : '📍 Haz clic en el mapa para elegir ubicación'}
              </span>
              {clickPosition && (
                <button
                  type="button"
                  onClick={() => setClickPosition(null)}
                  className="text-xs text-[#2258B1] hover:text-red-500 ml-2"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#2258B1] mt-1">
              El semáforo se colocará en la intersección más cercana
            </p>
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        className="w-full py-2 bg-[#2258B1] dark:bg-[#3B82F6] hover:bg-[#1a46a0] dark:hover:bg-[#2563eb] text-white font-medium text-sm rounded-lg transition-colors"
      >
        Agregar {type === 'vehicle' ? 'Vehículo' : 'Semáforo'}
      </button>
    </form>
  );
}
