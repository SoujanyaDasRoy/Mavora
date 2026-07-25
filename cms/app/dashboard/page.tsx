'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform, type Transition } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarComponent } from '@/components/Sidebar'
import { InviteWriterForm } from '@/components/InviteWriterForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

/* ── Lazy-load recharts (browser-only) ─────── */
const ActivityBarChart = dynamic(
  () => import('@/components/DashboardCharts').then((m) => ({ default: m.ActivityBarChart })),
  { ssr: false, loading: () => <div className="h-[320px] w-full bg-muted/10 animate-pulse rounded-xl" /> }
)
const ContentDonutChart = dynamic(
  () => import('@/components/DashboardCharts').then((m) => ({ default: m.ContentDonutChart })),
  { ssr: false, loading: () => <div className="h-[200px] w-full bg-muted/10 animate-pulse rounded-xl" /> }
)

interface Stats {
  draftCount: number
  publishedCount: number
  r2UsedBytes: number
  r2FreeTierBytes: number
  subscriberCount: number | null
  pageViews30d: number | null
}

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 55, damping: 14 })
  const display = useTransform(spring, (v) => {
    if (decimals === 0) return Math.round(v).toLocaleString()
    return v.toFixed(decimals)
  })
  useEffect(() => { spring.set(value) }, [spring, value])
  return <motion.span>{display}</motion.span>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user } = useUser()

  const loadStats = async () => {
    setLoading(true); setLoadError(false)
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) { setLoadError(true); return }
      setStats((await res.json()) as Stats)
    } catch { setLoadError(true) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadStats()
    setIsRefreshing(false)
  }

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'Admin'

  const usedGb  = stats ? stats.r2UsedBytes  / (1024 ** 3) : 0
  const freeGb  = stats ? stats.r2FreeTierBytes / (1024 ** 3) : 10
  const storagePct = Math.min((usedGb / freeGb) * 100, 100)

  const recentMock = [
    { title: 'The Future of AI-Powered Writing', category: 'AI & Tech', date: 'Jul 24, 2026', views: 1240, status: 'published' },
    { title: 'How SaaS companies grow to $1M ARR', category: 'Business', date: 'Jul 22, 2026', views: 890, status: 'published' },
    { title: 'Productivity systems for 2025',       category: 'Productivity', date: 'Jul 19, 2026', views: 0, status: 'draft' },
    { title: 'Business intelligence for founders',   category: 'Business', date: 'Jul 15, 2026', views: 0, status: 'draft' },
    { title: 'Claude vs GPT-4: A deep dive',         category: 'AI & Tech', date: 'Jul 11, 2026', views: 1850, status: 'published' },
  ]

  const TABS = ['Overview', 'Analytics', 'Writers', 'System']

  return (
    <SidebarProvider>
      <SidebarComponent />

      <SidebarInset className="bg-background">
        {/* Main Content Area with Generous Padding */}
        <div className="p-6 md:p-10 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Header section (Untitled UI Layout Style) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground font-sans">
                Welcome back, {firstName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Track, analyze, and manage the Mavora publication engine.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted h-10 px-4 text-sm font-medium transition-all gap-2 cursor-pointer"
              >
                <svg 
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Refresh
              </button>
              <Link href="/articles/new">
                <span className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 text-sm font-medium gap-2 transition-all cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Article
                </span>
              </Link>
            </div>
          </div>

          {/* Top Tabs Control */}
          <div className="flex items-center border-b border-border/40 pb-px">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium pb-3 relative transition-colors cursor-pointer ${
                    activeTab === tab 
                      ? 'text-foreground font-semibold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Missing Zone Tag Warning Alert */}
          {stats && stats.pageViews30d === null && (
            <div className="p-4 md:p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-4 shadow-sm">
              <div className="mt-0.5 text-amber-500 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-200">Cloudflare Web Analytics is not yet configured</h4>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  The dashboard cannot fetch page views because your Cloudflare Zone Tag is missing from Worker secrets.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <code className="text-xs font-mono bg-black/50 px-3 py-1 rounded border border-amber-900/30 text-amber-400 select-all">
                    npx wrangler secret put CLOUDFLARE_ZONE_TAG
                  </code>
                  <span className="text-[10px] text-amber-400/60">Run this command in your project directory.</span>
                </div>
              </div>
            </div>
          )}

          {/* Stat Cards Grid (Adaptive widths to prevent text wrapping) */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-border bg-card">
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-24 bg-muted/40 animate-pulse rounded" />
                    <div className="h-8 w-16 bg-muted/40 animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted/40 animate-pulse rounded" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {stats && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 } satisfies Transition}
            >
              {/* Published */}
              <Card className="border border-border bg-card p-0 shadow-sm hover:border-emerald-500/20 transition-colors">
                <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Published Articles
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-semibold tracking-tight">
                      <Counter value={stats.publishedCount} />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      ↑ 12.3%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Active and visible on site</p>
                </CardContent>
              </Card>

              {/* Drafts */}
              <Card className="border border-border bg-card p-0 shadow-sm hover:border-amber-500/20 transition-colors">
                <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Draft Articles
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-semibold tracking-tight">
                      <Counter value={stats.draftCount} />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      → Static
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pending publication</p>
                </CardContent>
              </Card>

              {/* Page Views */}
              <Card className="border border-border bg-card p-0 shadow-sm hover:border-blue-500/20 transition-colors">
                <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Page Views (30d)
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-semibold tracking-tight">
                      {stats.pageViews30d != null ? (
                        <Counter value={stats.pageViews30d} />
                      ) : (
                        <span className="text-muted-foreground/45">—</span>
                      )}
                    </div>
                    {stats.pageViews30d != null && (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ↑ 8.2%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Cloudflare web analytics</p>
                </CardContent>
              </Card>

              {/* Subscribers */}
              <Card className="border border-border bg-card p-0 shadow-sm hover:border-violet-500/20 transition-colors">
                <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Audience Subscribers
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-semibold tracking-tight">
                      {stats.subscriberCount != null ? (
                        <Counter value={stats.subscriberCount} />
                      ) : (
                        <span className="text-muted-foreground/45">—</span>
                      )}
                    </div>
                    {stats.subscriberCount != null && (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ↑ 4.1%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Buttondown list count</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Activity Chart & Bottom Grid */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.2 } satisfies Transition}
              className="space-y-6"
            >
              {/* Content Activity Chart */}
              <Card className="border border-border bg-card p-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight">Analytics overview</h3>
                    <p className="text-xs text-muted-foreground">
                      Compare page views and published content over the last 14 days.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#5b8fff]" />
                      Page Views
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffb347]" />
                      Articles
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <ActivityBarChart
                    pageViews={stats.pageViews30d}
                    publishedCount={stats.publishedCount}
                    draftCount={stats.draftCount}
                  />
                </CardContent>
              </Card>

              {/* Data Table Section (Untitled UI Transaction Table Style) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Articles Data Table */}
                <Card className="border border-border bg-card p-0 shadow-sm lg:col-span-2 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/40">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold tracking-tight">Recent articles</h3>
                      <p className="text-xs text-muted-foreground">Manage and track your latest content drafts.</p>
                    </div>
                    <Link href="/articles" className="text-xs font-semibold text-blue-500 hover:underline">
                      View all
                    </Link>
                  </CardHeader>
                  
                  {/* Table Element */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/15 border-b border-border/40">
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Article</th>
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Views</th>
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {recentMock.map((item, i) => (
                          <tr key={i} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-sm text-foreground">{item.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{item.date}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium text-foreground">{item.category}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                              {item.views > 0 ? item.views.toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`text-[10px] font-bold border-none uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  item.status === 'published'
                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10'
                                    : 'bg-muted/40 text-muted-foreground'
                                }`}
                              >
                                {item.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link href="/articles" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Right Side Widgets (Distribution & Storage) */}
                <div className="space-y-6">
                  {/* Distribution Card */}
                  <Card className="border border-border bg-card p-0 shadow-sm">
                    <CardHeader className="p-6 pb-4">
                      <h3 className="text-base font-semibold tracking-tight">Content Distribution</h3>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-6">
                      <ContentDonutChart
                        publishedCount={stats.publishedCount}
                        draftCount={stats.draftCount}
                      />

                      <Separator className="bg-border/40" />

                      {/* R2 Storage bar */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">
                            R2 Media Storage
                          </span>
                          <span className="font-bold text-foreground font-mono">{storagePct.toFixed(1)}%</span>
                        </div>
                        <Progress value={storagePct} className="h-2 bg-muted/40" />
                        <div className="text-[10px] text-muted-foreground/80 flex justify-between font-mono">
                          <span>{(usedGb * 1024).toFixed(1)} MB of {Math.round(freeGb)} GB</span>
                          <span>Free tier</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Invite Card */}
                  <Card className="border border-border bg-card p-0 shadow-sm" id="team">
                    <CardHeader className="p-6 pb-4">
                      <h3 className="text-base font-semibold tracking-tight">Invite editors</h3>
                      <p className="text-xs text-muted-foreground">Send a Clerk email invitation to your writing team.</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <InviteWriterForm compact />
                    </CardContent>
                  </Card>
                </div>

              </div>
            </motion.div>
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
