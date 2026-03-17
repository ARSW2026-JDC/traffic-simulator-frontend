import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
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

interface Props {
  simSocket: RefObject<Socket | null>;
}

export default function MapView({ simSocket }: Props) {
  return (
    <MapContainer
      center={[4.6534, -74.0836]}
      zoom={13}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <Markers simSocket={simSocket} />
    </MapContainer>
  );
}
