import { CircleMarker, Tooltip } from 'react-leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
import type { Vehicle } from '../../types';

interface Props {
  vehicle: Vehicle;
}

export function getStatusLabel(status: string): string {
  if (status === 'moving') return 'En movimiento';
  if (status === 'waiting') return 'Esperando';
  return 'Detenido';
}

export default function VehicleMarker({ vehicle }: Props) {
  const selected = useSimulationStore((s) => s.selectedId === vehicle.id);
  const selectEntity = useSimulationStore((s) => s.selectEntity);
  const radius = selected ? 7 : 4;

  return (
    <CircleMarker
      center={[vehicle.lat, vehicle.lon]}
      radius={radius}
      pathOptions={{
        color: selected ? '#FFFFFF' : 'transparent',
        fillColor: vehicle.color,
        fillOpacity: 0.95,
        weight: selected ? 3 : 0,
      }}
      eventHandlers={{
        click: () => selectEntity(vehicle.id, 'vehicle'),
      }}
    >
      {selected && (
        <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
          <span className="text-xs">
            {vehicle.name} — {vehicle.speed.toFixed(2)} km/h — {getStatusLabel(vehicle.status)}
          </span>
        </Tooltip>
      )}
    </CircleMarker>
  );
}
