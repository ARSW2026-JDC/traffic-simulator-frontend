import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
import type { Vehicle } from '../../types';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';

function createVehicleIcon(color: string, heading: number, selected: boolean): L.DivIcon {
  const size = selected ? 15 : 13;
  const border = selected ? `border: 2px solid white;` : '';
  const shadow = selected ? 'filter: drop-shadow(0 0 6px white);' : '';
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(${heading - 45}deg);
      ${border}
      ${shadow}
      box-shadow: 0 1px 4px rgba(0,0,0,0.6);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Props {
  vehicle: Vehicle;
  simSocket: RefObject<Socket | null>;
}

export default function VehicleMarker({ vehicle, simSocket: _simSocket }: Props) {
  const { selectedId, selectEntity } = useSimulationStore((s) => ({
    selectedId: s.selectedId,
    selectEntity: s.selectEntity,
  }));
  const selected = selectedId === vehicle.id;

  return (
    <Marker
      position={[vehicle.lat, vehicle.lon]}
      icon={createVehicleIcon(vehicle.color, vehicle.heading, selected)}
      eventHandlers={{
        click: () => selectEntity(vehicle.id, 'vehicle'),
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
        <span className="text-xs">
          {vehicle.name} — {vehicle.speed} km/h — {vehicle.status}
        </span>
      </Tooltip>
    </Marker>
  );
}
