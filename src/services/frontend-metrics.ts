const GATEWAY = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000'

const pageLoads: { metric: string; value: number }[] = []
const apiCalls: { method: string; route: string; duration: number }[] = []
const wsConnections: { namespace: string; seconds: number }[] = []
const jsErrors: { type: string }[] = []

export function reportApiCall(method: string, route: string, duration: number) {
  apiCalls.push({ method, route, duration })
}

export function reportPageLoad(metric: string, value: number) {
  pageLoads.push({ metric, value })
}

export function reportWsConnection(namespace: string, seconds: number) {
  wsConnections.push({ namespace, seconds })
}

export function reportJsError(type: string) {
  jsErrors.push({ type })
}

let intervalId: ReturnType<typeof setInterval> | null = null

async function sendBatch() {
  const body: Record<string, any> = {}
  if (pageLoads.length) body.pageLoads = pageLoads.splice(0)
  if (apiCalls.length) body.apiCalls = apiCalls.splice(0)
  if (wsConnections.length) body.wsConnections = wsConnections.splice(0)
  if (jsErrors.length) body.jsErrors = jsErrors.splice(0)

  if (!Object.keys(body).length) return

  try {
    await fetch(`${GATEWAY}/metrics/frontend-e2e`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {}
}

function captureNavigationTiming() {
  const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
  if (!nav) return

  reportPageLoad('ttfb', (nav.responseStart - nav.requestStart) / 1000)
  reportPageLoad('dom_ready', (nav.domComplete - nav.domContentLoadedEventEnd) / 1000)
}

function observeWebVitals() {
  if (!window.PerformanceObserver) return

  try {
    const fcpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        reportPageLoad('fcp', entry.startTime / 1000)
      }
    })
    fcpObs.observe({ type: 'first-contentful-paint', buffered: true })
  } catch {}

  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      reportPageLoad('lcp', last.startTime / 1000)
    })
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {}

  try {
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as any
        if (!shift.hadRecentInput) {
          reportPageLoad('cls', shift.value)
        }
      }
    })
    clsObs.observe({ type: 'layout-shift', buffered: true })
  } catch {}
}

function captureJsErrors() {
  window.addEventListener('error', (e) => {
    reportJsError(e.error?.name || 'uncaught')
  })
  window.addEventListener('unhandledrejection', () => {
    reportJsError('promise')
  })
}

export function startMetricsCollection() {
  if (intervalId) return

  captureNavigationTiming()
  observeWebVitals()
  captureJsErrors()

  sendBatch()
  intervalId = setInterval(sendBatch, 60_000)
}

export function stopMetricsCollection() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
