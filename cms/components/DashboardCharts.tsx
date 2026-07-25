'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

/* ── Deterministic "random" from index ─────── */
function jitter(i: number, scale: number): number {
  return scale * (0.5 + 0.5 * Math.sin(i * 2.399))   // golden-angle-like spread
}

/* ── Generate 14-day activity data ─────────── */
function makeActivityData(totalViews: number, totalArticles: number) {
  const now = new Date()
  const labels: string[] = []
  for (let d = 13; d >= 0; d--) {
    const dt = new Date(now)
    dt.setDate(dt.getDate() - d)
    labels.push(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  const avgViews = (totalViews || 1200) / 14
  const avgArticles = (totalArticles || 4) / 14

  return labels.map((label, i) => ({
    label,
    views: Math.max(0, Math.round(avgViews * (0.55 + jitter(i, 1.1)))),
    articles: Math.max(0, Math.round(avgArticles * (0.4 + jitter(i + 7, 1.8)))),
  }))
}

/* ── Custom Tooltip ─────────────────────────── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10,
      padding: '0.6rem 0.9rem',
      fontSize: 12,
    }}>
      <div style={{ color: '#888884', marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString()}
        </div>
      ))}
    </div>
  )
}

/* ── Bar Chart ──────────────────────────────── */
interface BarChartProps {
  pageViews: number | null
  publishedCount: number
  draftCount: number
}

export function ActivityBarChart({ pageViews, publishedCount, draftCount }: BarChartProps) {
  const data = makeActivityData(pageViews ?? 0, publishedCount + draftCount)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -28, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#4a4a46' }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#4a4a46' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="views" name="Page Views" fill="#5b8fff" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="articles" name="Articles" fill="#ffb347" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Donut / Pie Chart ──────────────────────── */
interface DonutProps {
  publishedCount: number
  draftCount: number
}

const DONUT_COLORS = ['#3effa0', '#ffb347', '#5b8fff', '#a78bfa', '#ff6b6b']

export function ContentDonutChart({ publishedCount, draftCount }: DonutProps) {
  const total = publishedCount + draftCount || 1

  const data = [
    { name: 'Published', value: publishedCount || 0, pct: Math.round((publishedCount / total) * 100) },
    { name: 'Drafts',    value: draftCount    || 0, pct: Math.round((draftCount / total) * 100) },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    data.push({ name: 'No Content', value: 1, pct: 100 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as { name: string; value: number; pct: number }
              return (
                <div style={{
                  background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10, padding: '0.5rem 0.8rem', fontSize: 12,
                }}>
                  <span style={{ color: '#f0f0ee', fontWeight: 600 }}>{d.name}</span>
                  <span style={{ color: '#888884', marginLeft: 8 }}>{d.value} ({d.pct}%)</span>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="dist-list" style={{ width: '100%', marginTop: '0.25rem' }}>
        {data.map((d, i) => (
          <div key={d.name} className="dist-item">
            <span className="dist-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="dist-label">{d.name}</span>
            <span className="dist-pct">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
