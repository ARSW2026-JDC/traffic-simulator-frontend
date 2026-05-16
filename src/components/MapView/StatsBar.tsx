import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

function AnimatedCounter({ value, suffix = '', duration = 400 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const rafRef = useRef(0)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    if (from === value) {
      setDisplay(value)
      return
    }
    prevRef.current = value
    cancelAnimationFrame(rafRef.current)
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <>{display}{suffix}</>
}

function RelativeTime({ timestamp }: { timestamp: number }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!timestamp) return null

  const diff = Math.max(0, Math.floor((now - timestamp) / 1000))
  let text = 'ahora'
  if (diff === 1) text = 'hace 1s'
  else if (diff < 60) text = `hace ${diff}s`
  else text = `hace ${Math.floor(diff / 60)}m`

  return <span className="sim-stats-ago">↻ {text}</span>
}

const TOOLTIP_COLLAPSED = 'Haz clic para ver estadísticas detalladas de la simulación'

export default function StatsBar() {
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const vehicles = useSimulationStore((s) => s.vehicles)
  const trafficLights = useSimulationStore((s) => s.trafficLights)
  const activeSimId = useSimulationStore((s) => s.activeSimId)
  const simStats = useSimulationStore((s) => s.simStats)

  const localStats = useMemo(() => {
    const vList = Object.values(vehicles)
    const lList = Object.values(trafficLights)

    const avgSpeed = vList.length > 0
      ? vList.reduce((sum, v) => sum + v.speed, 0) / vList.length
      : 0

    return {
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      vehicleCount: vList.length,
      movingCount: vList.filter((v) => v.status === 'moving').length,
      waitingCount: vList.filter((v) => v.status === 'waiting').length,
      stoppedCount: vList.filter((v) => v.status === 'stopped').length,
      redLightCount: lList.filter((l) => l.state === 'red').length,
      greenLightCount: lList.filter((l) => l.state === 'green').length,
      yellowLightCount: lList.filter((l) => l.state === 'yellow').length,
      totalLights: lList.length,
    }
  }, [vehicles, trafficLights])

  const avgSpeed = simStats?.avgSpeed ?? localStats.avgSpeed
  const vehicleCount = simStats?.vehicleCount ?? localStats.vehicleCount
  const movingCount = simStats?.movingCount ?? localStats.movingCount
  const waitingCount = simStats?.waitingCount ?? localStats.waitingCount
  const stoppedCount = simStats?.stoppedCount ?? localStats.stoppedCount
  const redLightCount = simStats?.redLightCount ?? localStats.redLightCount
  const greenLightCount = simStats?.greenLightCount ?? localStats.greenLightCount
  const yellowLightCount = simStats?.yellowLightCount ?? localStats.yellowLightCount
  const totalLights = simStats?.totalLights ?? localStats.totalLights
  const mostCongestedEdge = simStats?.mostCongestedEdge

  const collapse = useCallback(() => setExpanded(false), [])
  const toggle = useCallback(() => setExpanded((v) => !v), [])

  useEffect(() => {
    if (!expanded) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') collapse()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [expanded, collapse])

  useEffect(() => {
    if (!expanded) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        collapse()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expanded, collapse])

  if (!activeSimId) return null

  if (!expanded) {
    return (
      <button className="sim-stats-bar" onClick={toggle} type="button" title={TOOLTIP_COLLAPSED}>
        <span className="sim-stats-item sim-stats-item--tight">
          <span className="sim-stats-icon">⚡</span>
          <AnimatedCounter value={avgSpeed} suffix=" km/h" />
        </span>
        <span className="sim-stats-divider" />
        <span className="sim-stats-item sim-stats-item--tight">
          <span className="sim-stats-icon">🚗</span>
          <AnimatedCounter value={vehicleCount} />
        </span>
        <span className="sim-stats-divider" />
        <span className="sim-stats-item sim-stats-item--tight">
          <span className="sim-stats-red">{redLightCount}</span>
          <span className="sim-stats-muted">/{totalLights}</span>
        </span>
        <span className="sim-stats-hint">i</span>
      </button>
    )
  }

  return (
    <div className="sim-stats-panel" ref={panelRef}>
      <div className="sim-stats-panel-header">
        <span className="sim-stats-panel-title">📊 Estadísticas</span>
        <button className="sim-stats-panel-close" onClick={collapse} type="button" title="Colapsar (Esc)">−</button>
      </div>

      <div className="sim-stats-panel-body">
        <div className="sim-stats-row">
          <span className="sim-stats-label">⚡ Velocidad promedio</span>
          <span className="sim-stats-value"><AnimatedCounter value={avgSpeed} suffix=" km/h" /></span>
        </div>

        <div className="sim-stats-group">
          <div className="sim-stats-row sim-stats-row--main">
            <span className="sim-stats-label">🚗 Vehículos</span>
            <span className="sim-stats-value"><AnimatedCounter value={vehicleCount} /></span>
          </div>
          <div className="sim-stats-subrows">
            <div className="sim-stats-subrow">
              <span className="sim-stats-dot sim-stats-dot--moving" />
              <span>En movimiento</span>
              <span className="sim-stats-subvalue"><AnimatedCounter value={movingCount} /></span>
            </div>
            <div className="sim-stats-subrow">
              <span className="sim-stats-dot sim-stats-dot--waiting" />
              <span>Esperando</span>
              <span className="sim-stats-subvalue"><AnimatedCounter value={waitingCount} /></span>
            </div>
            <div className="sim-stats-subrow">
              <span className="sim-stats-dot sim-stats-dot--stopped" />
              <span>Detenidos</span>
              <span className="sim-stats-subvalue"><AnimatedCounter value={stoppedCount} /></span>
            </div>
          </div>
        </div>

        <div className="sim-stats-group">
          <div className="sim-stats-row sim-stats-row--main">
            <span className="sim-stats-label">🚦 Semáforos</span>
            <span className="sim-stats-value"><AnimatedCounter value={totalLights} /></span>
          </div>
          <div className="sim-stats-subrows">
            <div className="sim-stats-subrow">
              <span className="sim-stats-dot sim-stats-dot--green" />
              <span>Verdes</span>
              <span className="sim-stats-subvalue"><AnimatedCounter value={greenLightCount} /></span>
            </div>
            <div className="sim-stats-subrow">
              <span className="sim-stats-dot sim-stats-dot--yellow" />
              <span>Amarillos</span>
              <span className="sim-stats-subvalue"><AnimatedCounter value={yellowLightCount} /></span>
            </div>
            <div className="sim-stats-subrow">
              <span className="sim-stats-dot sim-stats-dot--red" />
              <span>Rojos</span>
              <span className="sim-stats-subvalue"><AnimatedCounter value={redLightCount} /></span>
            </div>
          </div>
        </div>

        {mostCongestedEdge && (
          <div className="sim-stats-row">
            <span className="sim-stats-label">🚧 Calle congestionada</span>
            <span className="sim-stats-value sim-stats-value--sm">
              Edge-{mostCongestedEdge.edgeId} · {mostCongestedEdge.highwayType} · {mostCongestedEdge.vehicleCount} veh
            </span>
          </div>
        )}

        <RelativeTime timestamp={simStats?.timestamp ?? 0} />
      </div>
    </div>
  )
}