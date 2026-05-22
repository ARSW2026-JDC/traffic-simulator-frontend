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
  const radius = selected ? 4 : 3;
  const speedPct = Math.min(vehicle.speed / 80, 1);
  const fillOpacity = 0.25 + 0.65 * speedPct;

  return (
    <CircleMarker
      center={[vehicle.lat, vehicle.lon]}
      radius={radius}
      pathOptions={{
        color: selected ? '#FFFFFF' : '#111827',
        fillColor: vehicle.color,
        fillOpacity,
        weight: selected ? 2 : 1,
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
