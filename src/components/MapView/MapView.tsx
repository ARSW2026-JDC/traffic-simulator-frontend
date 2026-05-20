import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { MapContainer, Rectangle, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
import { BASEMAPS, DEFAULT_BASEMAP_ID } from './basemaps';
import { useAuthStore } from '../../stores/authStore';
import VehicleMarker from './VehicleMarker';
import TrafficLightMarker from './TrafficLightMarker';
import StatsBar from './StatsBar';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';

const DEFAULT_CENTER: [number, number] = [4.6, -74.0836];
const DEFAULT_ZOOM = 13;

function Markers({ simSocket }: { simSocket: RefObject<Socket | null> }) {
  useMap();
  const vehicles = useSimulationStore((s) => s.vehicles);
  const trafficLights = useSimulationStore((s) => s.trafficLights);

  return (
    <>
      {Object.values(trafficLights).map((light) => (
        <TrafficLightMarker key={light.id} light={light} />
      ))}
      {Object.values(vehicles).map((vehicle) => (
        <VehicleMarker key={vehicle.id} vehicle={vehicle} simSocket={simSocket} />
      ))}
    </>
  );
}

function CustomZoomControls() {
  const map = useMap();

  const zoomIn = () => map.setZoom(map.getZoom() + 1);
  const zoomOut = () => map.setZoom(map.getZoom() - 1);
  const resetView = () => map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  return (
    <div className="sim-map-zoom-controls" role="group" aria-label="Controles de zoom">
      <button onClick={zoomIn} type="button">+</button>
      <button onClick={resetView} type="button" className="sim-map-zoom-reset">⌖</button>
      <button onClick={zoomOut} type="button">-</button>
    </div>
  );
}

function SimulationViewportController() {
  const map = useMap();
  const activeSimId = useSimulationStore((s) => s.activeSimId);
  const vehicles = useSimulationStore((s) => s.vehicles);
  const trafficLights = useSimulationStore((s) => s.trafficLights);
  const lastFocusedSimRef = useRef<string | null>(null);

  const points = useMemo<[number, number][]>(() => {
    const vehiclePoints = Object.values(vehicles).map((vehicle) => [vehicle.lat, vehicle.lon] as [number, number]);
    const lightPoints = Object.values(trafficLights).map((light) => [light.lat, light.lon] as [number, number]);
    return [...vehiclePoints, ...lightPoints];
  }, [vehicles, trafficLights]);

  useEffect(() => {
    if (!activeSimId) {
      lastFocusedSimRef.current = null;
      return;
    }

    if (lastFocusedSimRef.current === activeSimId) return;
    if (points.length === 0) return;

    if (points.length === 1) {
      map.flyTo(points[0], 15, { duration: 1 });
    } else {
      map.flyToBounds(points, { padding: [40, 40], duration: 1 });
    }

    lastFocusedSimRef.current = activeSimId;
  }, [activeSimId, map, points]);

  return null;
}

function BboxSelector() {
  const [start, setStart] = useState<{ lat: number; lng: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const { bbox, setBbox } = useSimulationStore((s) => ({ bbox: s.bbox, setBbox: s.setBbox }));
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useMapEvents({
    mousedown: (event) => {
      if (!isAdmin || event.originalEvent.button !== 2) return;
      event.originalEvent.preventDefault();
      setStart({ lat: event.latlng.lat, lng: event.latlng.lng });
      setDragging(true);
      setBbox(null);
    },
    mousemove: (event) => {
      if (!isAdmin || !dragging || !start) return;
      const current = { lat: event.latlng.lat, lng: event.latlng.lng };
      setBbox({
        minLng: Math.min(start.lng, current.lng),
        minLat: Math.min(start.lat, current.lat),
        maxLng: Math.max(start.lng, current.lng),
        maxLat: Math.max(start.lat, current.lat),
      });
    },
    mouseup: (event) => {
      if (!isAdmin || event.originalEvent.button !== 2) return;
      event.originalEvent.preventDefault();
      setDragging(false);
      setStart(null);
    },
    contextmenu: (event) => {
      if (!isAdmin) return;
      event.originalEvent.preventDefault();
    },
  });

  if (!bbox) return null;

  return (
    <Rectangle
      bounds={[
        [bbox.minLat, bbox.minLng],
        [bbox.maxLat, bbox.maxLng],
      ]}
      pathOptions={{ color: '#f59e0b', weight: 2, fillOpacity: 0.12 }}
    />
  );
}

function HighlightedEdge() {
  const map = useMap()
  const highlightPosition = useSimulationStore((s) => s.highlightPosition)
  const setHighlightPosition = useSimulationStore((s) => s.setHighlightPosition)

  useEffect(() => {
    if (!highlightPosition) return
    map.flyTo([highlightPosition.lat, highlightPosition.lng], 16, { duration: 0.8 })
    const timer = setTimeout(() => setHighlightPosition(null), 5000)
    return () => clearTimeout(timer)
  }, [highlightPosition, map, setHighlightPosition])

  if (!highlightPosition) return null

  const { lat, lng } = highlightPosition
  const halfDeg = 0.00045
  const bounds: [[number, number], [number, number]] = [
    [lat - halfDeg, lng - halfDeg],
    [lat + halfDeg, lng + halfDeg],
  ]

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: '#2258B1',
        fillColor: '#2258B1',
        fillOpacity: 0.2,
        weight: 2,
      }}
    />
  )
}

function PickHandler() {
  const addMode = useSimulationStore((s) => s.addMode);
  const clickPosition = useSimulationStore((s) => s.clickPosition);
  const setClickPosition = useSimulationStore((s) => s.setClickPosition);

  useMapEvents({
    click: (event) => {
      if (addMode === 'trafficLight') {
        setClickPosition({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    },
  });

  if (addMode !== 'trafficLight' || !clickPosition) return null;

  return (
    <Circle
      center={[clickPosition.lat, clickPosition.lng]}
      radius={6}
      pathOptions={{ color: '#2258B1', fillColor: '#2258B1', fillOpacity: 0.5, weight: 2 }}
    />
  );
}

interface Props {
  simSocket: RefObject<Socket | null>;
}

export default function MapView({ simSocket }: Props) {
  const basemapId = useSimulationStore((s) => s.basemapId);
  const basemap =
    BASEMAPS.find((entry) => entry.id === basemapId) ??
    BASEMAPS.find((entry) => entry.id === DEFAULT_BASEMAP_ID) ??
    BASEMAPS[0];

  return (
    <Fragment>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url={basemap.url}
          attribution={basemap.attribution}
          subdomains={basemap.subdomains}
          maxZoom={basemap.maxZoom ?? 19}
        />
        <CustomZoomControls />
        <SimulationViewportController />
        <BboxSelector />
        <PickHandler />
        <HighlightedEdge />
        <Markers simSocket={simSocket} />
      </MapContainer>
      <StatsBar />
    </Fragment>
  );
}
