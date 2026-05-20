import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import { useHistoryStore } from '../../stores/historyStore';
import { useSimulationStore } from '../../stores/simulationStore';
import type { ChangeLogEntry } from '../../types';

interface Props {
  historySocket: {
    socketRef: RefObject<Socket | null>;
    loadMoreRef: RefObject<(() => void) | null>;
  };
}

const ENTITY_CONFIG: Record<string, { label: string; color: string }> = {
  vehicle: { label: 'Vehículo', color: '#3b82f6' },
  trafficLight: { label: 'Semáforo', color: '#eab308' },
};

const ACTION_COLORS: Record<string, string> = {
  add: '#16a34a',
  modify: '#2563eb',
  delete: '#dc2626',
};

const ACTION_VERBS: Record<string, string> = {
  add: 'creó',
  modify: 'actualizó',
  delete: 'eliminó',
};

export function actionFromField(field: string | undefined): string {
  if (field === 'created') return 'add';
  if (field === 'deleted') return 'delete';
  return 'modify';
}

function formatTime(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
  }).format(new Date(ts));
}

function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ts));
}

function getActionInfo(entry: ChangeLogEntry) {
  const action = entry.action || actionFromField(entry.field);
  return {
    verb: ACTION_VERBS[action] || 'actualizo',
    color: ACTION_COLORS[action] || '#2563eb'
  };
}

function getEntityInfo(entry: ChangeLogEntry) {
  return ENTITY_CONFIG[entry.entityType] || { label: entry.entityType, color: '#6b7280' };
}

function getCardTitle(entry: ChangeLogEntry) {
  const action = getActionInfo(entry);
  const entity = getEntityInfo(entry);
  return `${entry.userName} ${action.verb} ${entity.label}`;
}

function diffObjects(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
) {
  if (!before || !after) return [] as Array<{ path: string; before: unknown; after: unknown }>;
  const changes: Array<{ path: string; before: unknown; after: unknown }> = [];

  const walk = (a: any, b: any, base: string) => {
    const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
    for (const key of keys) {
      const nextPath = base ? `${base}.${key}` : key;
      const av = a?.[key];
      const bv = b?.[key];
      const isObject = typeof av === 'object' && typeof bv === 'object' && av && bv;
      if (isObject && !Array.isArray(av) && !Array.isArray(bv)) {
        walk(av, bv, nextPath);
      } else if (av !== bv) {
        changes.push({ path: nextPath, before: av, after: bv });
      }
    }
  };

  walk(before, after, '');
  return changes;
}

export default function HistoryPanel({ historySocket }: Props) {
  const { entries, isLoading, isLoadingMore, hasMore } = useHistoryStore();
  const activeSimId = useSimulationStore((s) => s.activeSimId);
  const [selected, setSelected] = useState<ChangeLogEntry | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (items) => {
        if (items.some((item) => item.isIntersecting)) {
          historySocket.loadMoreRef.current?.();
        }
      },
      { root: el.parentElement, threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [historySocket.loadMoreRef]);

  const selectedDiff = useMemo(() => {
    if (!selected?.before || !selected?.after) return [];
    return diffObjects(selected.before, selected.after).slice(0, 30);
  }, [selected]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="h-6 w-6 border-2 border-[#2258B1] rounded-full border-t-2 border-transparent animate-spin"></div>
        <span className="mt-2 text-xs text-[var(--s-sub)]">Cargando historial...</span>
      </div>
    );
  }

if (entries.length === 0) {
    const message = !activeSimId ? 'Selecciona una simulación' : 'Sin cambios registrados';
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--s-sub)]">{message}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="history-card-header">
        <span className="history-card-count">{entries.length} cambios</span>
      </div>
      
      <div className="history-card-list" role="list">
        {entries.map((entry) => {
          const action = getActionInfo(entry);
          const entity = getEntityInfo(entry);
          
          return (
            <button
              key={entry.id}
              type="button"
              className="history-card-item"
              onClick={() => setSelected(entry)}
            >
              <div className="history-card-content">
                <div className="history-card-top">
                  <span className="history-card-entity" style={{ color: entity.color }}>{entity.label}</span>
                  <span className="history-card-time">{formatTime(entry.timestamp)}</span>
                </div>
                <div className="history-card-title">
                  <span className="history-card-user">{entry.userName}</span>
                  <span className="history-card-action" style={{ color: action.color }}> {action.verb} </span>
                </div>
                <div className="history-card-id">ID: {entry.entityId}</div>
              </div>
            </button>
          );
        })}
        
        <div ref={sentinelRef} style={{ height: 1 }} />
        
        {isLoadingMore && (
          <div className="history-card-loading">Cargando más...</div>
        )}
        {!hasMore && entries.length > 0 && (
          <div className="history-card-loading">Fin del historial</div>
        )}
      </div>

      {selected && (
        <div className="history-drawer-overlay" role="dialog" aria-modal="true">
          <div className="history-drawer-backdrop" role="presentation" onClick={() => setSelected(null)} />
          <div className="history-drawer-panel">
            <div className="history-drawer-header">
              <div>
                <h3 className="history-drawer-title">{getCardTitle(selected)}</h3>
                <p className="history-drawer-time">{formatDateTime(selected.timestamp)}</p>
              </div>
              <button className="history-drawer-close" onClick={() => setSelected(null)} type="button">
                X
              </button>
            </div>

            {selectedDiff.length > 0 && (
              <div className="history-drawer-section">
                <h4>Cambios detectados</h4>
                <div className="history-drawer-diff">
                  {selectedDiff.slice(0, 15).map((change) => (
                    <div key={change.path} className="history-drawer-diff-row">
                      <span className="history-drawer-diff-path">{change.path}</span>
                      <div className="history-drawer-diff-values">
                        <span className="history-drawer-diff-before">{String(change.before ?? '-')}</span>
                        <span className="history-drawer-diff-arrow">→</span>
                        <span className="history-drawer-diff-after">{String(change.after ?? '-')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="history-drawer-columns">
              <div className="history-drawer-column">
                <h4>Estado anterior</h4>
                <pre className="history-drawer-json">
                  {selected.before ? JSON.stringify(selected.before, null, 2) : 'Sin datos'}
                </pre>
              </div>
              <div className="history-drawer-column">
                <h4>Estado nuevo</h4>
                <pre className="history-drawer-json">
                  {selected.after ? JSON.stringify(selected.after, null, 2) : 'Sin datos'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}