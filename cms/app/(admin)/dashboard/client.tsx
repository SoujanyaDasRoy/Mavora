'use client'

import { Activity, Calendar, Doc, Folder } from '@carbon/icons-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedList } from '@/components/ui/animated-list'
import { GridPattern } from '@/components/ui/grid-pattern'
import { Progress } from '@/components/ui/progress'
import { BorderBeam } from '@/components/ui/border-beam'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import type { AuditEvent } from '@/lib/audit'
import { cn } from '@/lib/utils'

interface KpiTile {
  title: string
  value: number
  /** 0–1 normalized "VU level". Drives the bottom bar's fill width. */
  level: number
  delta?: { sign: 'up' | 'down' | 'flat'; label: string }
  icon: React.ReactNode
}

interface SeriesPoint {
  date: string
  value: number
}

interface DashboardClientProps {
  role: 'admin' | 'writer'
  displayName: string
  draftCount: number
  publishedCount: number
  subscriberCount: number | null
  pageViews30d: number | null
  r2UsedBytes: number
  r2FreeTierBytes: number
  events: AuditEvent[]
  pageViewsSeries: SeriesPoint[]
  subscriberSeries: SeriesPoint[]
}

function formatBytes(bytes: number): { value: number; unit: string } {
  if (bytes >= 1024 ** 3) return { value: bytes / 1024 ** 3, unit: 'GB' }
  if (bytes >= 1024 ** 2) return { value: bytes / 1024 ** 2, unit: 'MB' }
  if (bytes >= 1024) return { value: bytes / 1024, unit: 'KB' }
  return { value: bytes, unit: 'B' }
}

function pct(num: number, denom: number): number {
  if (denom <= 0) return 0
  return Math.min(100, Math.max(0, (num / denom) * 100))
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function ActionIcon({ action }: { action: string }) {
  if (action === 'create') return <Doc className="size-4" />
  if (action === 'update') return <Activity className="size-4" />
  if (action === 'publish') return <Calendar className="size-4" />
  return <Folder className="size-4" />
}

export function DashboardClient(props: DashboardClientProps) {
  const storage = formatBytes(props.r2UsedBytes)
  const storagePct = pct(props.r2UsedBytes, props.r2FreeTierBytes)

  const kpis: KpiTile[] = [
    { title: 'Drafts', value: props.draftCount, level: clamp01(props.draftCount / 10), icon: <Doc className="size-5" /> },
    { title: 'Published', value: props.publishedCount, level: clamp01(props.publishedCount / 50), icon: <Activity className="size-5" /> },
    {
      title: 'Subscribers',
      value: props.subscriberCount ?? 0,
      level: clamp01((props.subscriberCount ?? 0) / 1000),
      delta: props.subscriberCount === null ? { sign: 'flat', label: 'Not configured' } : undefined,
      icon: <Folder className="size-5" />,
    },
    {
      title: 'Page views (30d)',
      value: props.pageViews30d ?? 0,
      level: clamp01((props.pageViews30d ?? 0) / 5000),
      delta: props.pageViews30d === null ? { sign: 'flat', label: 'Not configured' } : undefined,
      icon: <Calendar className="size-5" />,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 md:p-8">
        <GridPattern
          width={32}
          height={32}
          x={-1}
          y={-1}
          className="absolute inset-0 h-full w-full fill-[var(--color-fg-subtle)]/15 stroke-[var(--color-fg-subtle)]/15 [mask-image:linear-gradient(0deg,transparent,black,transparent)]"
        />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-fg-subtle)]">Welcome back</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {props.displayName}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
              {props.role === 'admin'
                ? 'You have full access to every article, the team, and storage.'
                : 'Here is what your articles have been doing.'}
            </p>
          </div>
          <ShimmerButton
            href="/articles/new"
            background="var(--color-accent)"
            shimmerColor="rgba(255,255,255,0.35)"
            className="text-white"
          >
            + New Article
          </ShimmerButton>
        </div>
      </div>

      {/* KPI row — VU meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                {kpi.title}
              </span>
              <span className="text-[var(--color-fg-muted)]">{kpi.icon}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <NumberTicker value={kpi.value} className="!text-[var(--color-fg)]" />
              </span>
              {kpi.delta && (
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-[0.14em]',
                    kpi.delta.sign === 'up' && 'text-[var(--color-positive)]',
                    kpi.delta.sign === 'down' && 'text-[var(--color-negative)]',
                    kpi.delta.sign === 'flat' && 'text-[var(--color-fg-subtle)]'
                  )}
                >
                  {kpi.delta.label}
                </span>
              )}
            </div>
            {/* VU bar — two layers: track at 6% opacity, fill on top with a
             * 1px amber hairline. The fill width tracks `kpi.level` so the
             * dashboard reads as four faders rising and falling. */}
            <div
              className="mt-5 h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
              aria-hidden
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${kpi.level * 100}%`,
                  background: 'linear-gradient(90deg, var(--color-accent-hover), var(--color-accent))',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Storage + sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 overflow-hidden">
          <BorderBeam size={120} duration={8} colorFrom="var(--color-accent)" colorTo="var(--color-accent-hover)" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[var(--color-fg-subtle)]">R2 Storage</span>
            <Folder className="size-5 text-[var(--color-fg-muted)]" />
          </div>
          <div className="mt-3 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {storage.value.toFixed(storage.value < 10 ? 2 : 1)} {storage.unit}
          </div>
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
            of {formatBytes(props.r2FreeTierBytes).value.toFixed(0)} GB free tier
          </p>
          <Progress value={storagePct} className="mt-4" />
          <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">{storagePct.toFixed(1)}% used</p>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[var(--color-fg-subtle)]">Page views (last 30d)</span>
            <span className="text-xs text-[var(--color-fg-muted)]">
              {props.pageViews30d === null ? 'Mocked (CF not configured)' : 'Cloudflare Analytics'}
            </span>
          </div>
          <div className="h-40 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={props.pageViewsSeries}>
                <defs>
                  <linearGradient id="dashboard-pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={{ fontSize: 10, fill: 'var(--color-fg-subtle)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--color-fg)',
                  }}
                  labelStyle={{ color: 'var(--color-fg-muted)' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  fill="url(#dashboard-pv)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity + subscriber sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <span className="text-xs text-[var(--color-fg-subtle)]">
              {props.role === 'admin' ? 'Admins only' : 'Restricted'}
            </span>
          </div>
          <div className="mt-4 min-h-[180px]">
            {props.role === 'admin' && props.events.length > 0 ? (
              <AnimatedList delay={2200} className="items-stretch gap-2">
                {props.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm"
                  >
                    <span className="text-[var(--color-fg-muted)]">
                      <ActionIcon action={ev.action} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{ev.actorName ?? 'Unknown'}</span>{' '}
                        <span className="text-[var(--color-fg-muted)]">{ev.action}d</span>{' '}
                        {ev.articleTitle && (
                          <span className="text-[var(--color-fg-muted)]">· {ev.articleTitle}</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">{ev.createdAt}</p>
                    </div>
                  </div>
                ))}
              </AnimatedList>
            ) : (
              <p className="text-sm text-[var(--color-fg-muted)]">
                {props.role === 'admin'
                  ? 'No activity yet — once writers create/edit articles, events will appear here.'
                  : 'Activity feed is admin-only.'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[var(--color-fg-subtle)]">Subscribers</span>
            <span className="text-xs text-[var(--color-fg-muted)]">
              {props.subscriberCount === null ? 'Mocked' : 'Buttondown'}
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            <NumberTicker value={props.subscriberCount ?? 0} className="!text-[var(--color-fg)]" />
          </div>
          <div className="h-28 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={props.subscriberSeries}>
                <defs>
                  <linearGradient id="dashboard-sub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--color-fg)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-positive)"
                  strokeWidth={2}
                  fill="url(#dashboard-sub)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live signal — single restrained strip, not a marquee. Reads as a
       * quiet "powered-up" indicator between content blocks. */}
      <div className="flex items-center gap-3 px-1">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          On air
        </span>
        <div className="signal-strip flex-1" aria-hidden />
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          30d window
        </span>
      </div>
    </div>
  )
}