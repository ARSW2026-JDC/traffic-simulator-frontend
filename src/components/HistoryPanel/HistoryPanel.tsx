import { useHistoryStore } from '../../stores/historyStore';

const ENTITY_COLORS: Record<string, string> = {
  vehicle: 'text-blue-400',
  trafficLight: 'text-yellow-400',
};

const FIELD_LABELS: Record<string, string> = {
  speed: 'speed',
  color: 'color',
  name: 'name',
  greenDuration: 'green dur.',
  yellowDuration: 'yellow dur.',
  redDuration: 'red dur.',
  created: 'created',
  deleted: 'deleted',
};

const formatFieldValue = (field: string, value: string) => {
  if (field !== 'speed') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : value;
};

export default function HistoryPanel() {
  const { entries, isLoading } = useHistoryStore();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-muted text-sm">Loading history...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-muted text-sm">No changes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-2 border-b border-border">
        <span className="text-xs text-muted">{entries.length} changes</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div key={entry.id} className="px-4 py-3 hover:bg-surface/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${ENTITY_COLORS[entry.entityType] || 'text-muted'}`}>
                {entry.entityType}
              </span>
              <span className="text-xs text-slate-600">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              <span className="text-muted">{entry.userName}</span>
              {' changed '}
              <span className="text-white">{FIELD_LABELS[entry.field] || entry.field}</span>
              {entry.field !== 'created' && entry.field !== 'deleted' && (
                <>
                  {' from '}
                  <span className="font-mono text-slate-400">
                    {formatFieldValue(entry.field, entry.oldValue)}
                  </span>
                  {' → '}
                  <span className="font-mono text-blue-300">
                    {formatFieldValue(entry.field, entry.newValue)}
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 font-mono truncate">{entry.entityId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
