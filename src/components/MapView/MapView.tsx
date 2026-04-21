import { useState } from 'react';
import { MapContainer, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
import { BASEMAPS, DEFAULT_BASEMAP_ID } from './basemaps';
import { useAuthStore } from '../../stores/authStore';
import VehicleMarker from './VehicleMarker';
import TrafficLightMarker from './TrafficLightMarker';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';

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
    <MapContainer
      center={[4.60, -74.0836]}
      zoom={13}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        url={basemap.url}
        attribution={basemap.attribution}
        subdomains={basemap.subdomains}
        maxZoom={basemap.maxZoom ?? 19}
      />
      <BboxSelector />
      <Markers simSocket={simSocket} />
    </MapContainer>
  );
}
