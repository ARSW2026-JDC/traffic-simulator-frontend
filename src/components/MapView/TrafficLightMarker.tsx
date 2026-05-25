import { CircleMarker, Tooltip } from 'react-leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
import type { TrafficLight } from '../../types';

const STATE_COLORS = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' };

export function getLightLabel(state: string): string {
  if (state === 'green') return 'Verde';
  if (state === 'yellow') return 'Amarillo';
  return 'Rojo';
}

interface Props {
  light: TrafficLight;
}

export default function TrafficLightMarker({ light }: Props) {
  const selected = useSimulationStore((s) => s.selectedId === light.id);
  const selectEntity = useSimulationStore((s) => s.selectEntity);

  return (
    <CircleMarker
      center={[light.lat, light.lon]}
      radius={selected ? 8 : 6}
      pathOptions={{
        color: selected ? '#FFFFFF' : '#374151',
        fillColor: STATE_COLORS[light.state],
        fillOpacity: 0.95,
        weight: selected ? 3 : 1,
      }}
      eventHandlers={{
        click: () => selectEntity(light.id, 'trafficLight'),
      }}
    >
      {selected && (
        <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
          <span className="text-xs">
            {light.name} — {getLightLabel(light.state)}
          </span>
        </Tooltip>
      )}
    </CircleMarker>
  );
}
