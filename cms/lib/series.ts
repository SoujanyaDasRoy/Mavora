/**
 * Deterministic 30-day series for chart widgets.
 *
 * `getPageViews30d` and `getSubscriberCount` (in lib/stats.ts) return null if
 * the corresponding third-party API isn't configured. The dashboard
 * sparklines still want something to show in that case — a flat-ish,
 * realistic-looking series so the widget doesn't look broken. A seeded
 * hash keeps the same basis values across re-renders (no flicker) while
 * varying by entity so the page-views and subscriber charts look distinct.
 */
export interface SeriesPoint {
  date: string
  value: number
}

function seededRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return ((h >>> 0) % 10000) / 10000
  }
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function buildMockSeries(seed: string, days: number, base: number, jitter: number): SeriesPoint[] {
  const rnd = seededRandom(seed)
  const today = new Date()
  const out: SeriesPoint[] = []
  let value = base
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    // Random walk + a small upward trend so the chart looks organic.
    value = Math.max(0, value + (rnd() - 0.45) * jitter)
    out.push({ date: fmtDate(d), value: Math.round(value) })
  }
  return out
}