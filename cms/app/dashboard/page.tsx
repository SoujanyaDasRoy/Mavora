"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ─── Icons ───
const LayoutDashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)
const BarChart3Icon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
  </svg>
)
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" />
  </svg>
)
const RefreshCwIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
  </svg>
)
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

// ─── Mock Data ───
const chartData = [
  { day: "Jul 12", views: 4200, volume: 2400 },
  { day: "Jul 13", views: 5100, volume: 2800 },
  { day: "Jul 14", views: 4800, volume: 3100 },
  { day: "Jul 15", views: 6200, volume: 3500 },
  { day: "Jul 16", views: 5900, volume: 3300 },
  { day: "Jul 17", views: 7100, volume: 4100 },
  { day: "Jul 18", views: 6800, volume: 3900 },
  { day: "Jul 19", views: 7400, volume: 4200 },
  { day: "Jul 20", views: 6900, volume: 3800 },
  { day: "Jul 21", views: 8200, volume: 4600 },
  { day: "Jul 22", views: 7800, volume: 4400 },
  { day: "Jul 23", views: 8500, volume: 4900 },
  { day: "Jul 24", views: 9100, volume: 5200 },
  { day: "Jul 25", views: 8800, volume: 5000 },
]

const donutData = [
  { name: "Articles", value: 45, color: "#a1a1aa" },
  { name: "Videos", value: 30, color: "#71717a" },
  { name: "Podcasts", value: 15, color: "#52525b" },
  { name: "Docs", value: 10, color: "#3f3f46" },
]

const tableData = [
  { name: "Q3 Performance Report", date: "Oct 24, 2024", category: "Analytics", views: "24,592", status: "Published" },
  { name: "API Integration Guide", date: "Oct 22, 2024", category: "Documentation", views: "18,204", status: "Published" },
  { name: "Design System v2.0", date: "Oct 20, 2024", category: "Design", views: "12,847", status: "Draft" },
  { name: "Onboarding Flow Audit", date: "Oct 18, 2024", category: "Product", views: "9,120", status: "Review" },
  { name: "Infrastructure Costs", date: "Oct 15, 2024", category: "Finance", views: "7,430", status: "Published" },
  { name: "User Research Q3", date: "Oct 12, 2024", category: "Research", views: "5,210", status: "Archived" },
]

const navItems = [
  { icon: LayoutDashboardIcon, label: "Overview", active: true },
  { icon: BarChart3Icon, label: "Analytics", active: false },
  { icon: FileTextIcon, label: "Content", active: false },
  { icon: UsersIcon, label: "Audience", active: false },
  { icon: SettingsIcon, label: "Settings", active: false },
]

const tabs = ["Overview", "Analytics", "Settings"]

// ─── Components ───

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const { user, isLoaded } = useUser()
  const initials = isLoaded && user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("")
    : "U"
  const name = isLoaded && user?.fullName ? user.fullName : "User"

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* On mobile: fixed overlay. On desktop: sticky inline sidebar in flex row */}
      <aside
        style={{ width: 260 }}
        className={`
          flex-col shrink-0 border-r border-zinc-800/40 bg-zinc-950 overflow-hidden
          fixed left-0 top-0 z-40 h-screen md:sticky md:top-0 md:h-screen md:z-auto
          ${isOpen ? "flex" : "hidden"} md:flex
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/40 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100">
              <div className="h-3 w-3 rounded-sm bg-zinc-950" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">Telemetry</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-400 hover:text-zinc-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {item.active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -left-4 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-zinc-100"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-zinc-800/40 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800/40 bg-zinc-900/40 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{name}</p>
              <p className="truncate text-xs text-zinc-500">Pro Plan</p>
            </div>
            <SettingsIcon className="h-4 w-4 shrink-0 text-zinc-500" />
          </div>
        </div>
      </aside>
    </>
  )
}

function MetricCard({
  label,
  value,
  trend,
  trendType,
}: {
  label: string
  value: string
  trend: string
  trendType: "up" | "down" | "neutral"
}) {
  const trendStyles = {
    up: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    down: "bg-red-500/10 text-red-400 border-red-500/20",
    neutral: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }
  const trendIcon = {
    up: "↑",
    down: "↓",
    neutral: "→",
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-950 shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6 pb-2">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
      </div>
      <div className="p-6 pt-0">
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-semibold tracking-tight text-zinc-100">{value}</h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${trendStyles[trendType]}`}
          >
            {trendIcon[trendType]} {trend}
          </span>
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-medium text-zinc-400">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-500">{entry.name}:</span>
          <span className="font-mono font-medium text-zinc-200">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Draft: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
    Review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Archived: "bg-red-500/10 text-red-400 border-red-500/20",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.Draft}`}
    >
      {status}
    </span>
  )
}

// ─── Main Page ───
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoaded } = useUser()

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1200)
  }

  const storageUsed = 68.4
  const storageTotal = 100

  const firstName = isLoaded && user?.firstName ? user.firstName : "User"

  return (
    <div
      className="flex min-h-screen bg-zinc-950 text-zinc-100"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main area takes all remaining space after sidebar */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        <main className="w-full max-w-7xl mx-auto p-6 md:p-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-0">
                <button className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100" onClick={() => setSidebarOpen(true)}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                    Welcome back, {firstName}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500">
                    Here&apos;s what&apos;s happening with your projects today.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-800/40 bg-zinc-900/40 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                >
                  <RefreshCwIcon
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200">
                  <PlusIcon className="h-4 w-4" />
                  New Project
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="relative border-b border-zinc-800/40">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-100"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total Views" value="2.4M" trend="12.3%" trendType="up" />
              <MetricCard label="Active Users" value="48,291" trend="8.1%" trendType="up" />
              <MetricCard label="Bounce Rate" value="42.8%" trend="2.4%" trendType="down" />
              <MetricCard label="Avg. Session" value="4m 12s" trend="0.0%" trendType="neutral" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Bar Chart */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-800/40 bg-zinc-950 p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-zinc-100">
                      Analytics Overview
                    </h3>
                    <p className="mt-0.5 text-sm text-zinc-500">Content views and volume over the last 14 days</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      <span className="text-zinc-500">Views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-zinc-600" />
                      <span className="text-zinc-500">Volume</span>
                    </div>
                  </div>
                </div>
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        dy={8}
                        interval={1}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#18181b", radius: 4 }} />
                      <Bar dataKey="views" fill="#d4d4d8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="volume" fill="#52525b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-6">
                {/* Donut Chart */}
                <div className="rounded-xl border border-zinc-800/40 bg-zinc-950 p-6 shadow-sm">
                  <h3 className="mb-1 text-base font-semibold tracking-tight text-zinc-100">
                    Content Distribution
                  </h3>
                  <p className="mb-6 text-sm text-zinc-500">Breakdown by content type</p>
                  <div className="flex items-center gap-6">
                    <div className="h-[200px] w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={88}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {donutData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-zinc-400">{item.name}</span>
                          </div>
                          <span className="font-mono font-medium text-zinc-200">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div className="rounded-xl border border-zinc-800/40 bg-zinc-950 p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold tracking-tight text-zinc-100">
                      Storage
                    </h3>
                    <span className="font-mono text-xs text-zinc-500">
                      {storageUsed} / {storageTotal} GB
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
                    <motion.div
                      className={`h-full rounded-full ${
                        (storageUsed / storageTotal) < 0.5 ? "bg-zinc-300" : (storageUsed / storageTotal) <= 0.8 ? "bg-amber-400" : "bg-red-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(storageUsed / storageTotal) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>{storageUsed} GB used</span>
                    <span>{(storageTotal - storageUsed).toFixed(1)} GB free</span>
                  </div>
                  {(storageUsed / storageTotal) > 0.5 && (
                    <p className="mt-3 text-xs font-medium text-amber-500">
                      ⚠ Consider upgrading your storage plan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border border-zinc-800/40 bg-zinc-950 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800/40 p-6">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-zinc-100">
                    Recent Items
                  </h3>
                  <p className="mt-0.5 text-sm text-zinc-500">Latest content and their performance</p>
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    className="h-9 w-64 rounded-lg border border-zinc-700/50 bg-zinc-900/40 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700 focus:bg-zinc-900"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/40 bg-muted/15">
                      <th className="px-6 py-3.5 font-medium text-zinc-500">Name</th>
                      <th className="px-6 py-3.5 font-medium text-zinc-500">Category</th>
                      <th className="px-6 py-3.5 font-medium text-zinc-500">Views</th>
                      <th className="px-6 py-3.5 font-medium text-zinc-500">Status</th>
                      <th className="px-6 py-3.5 text-right font-medium text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="group cursor-pointer border-b border-zinc-800/30 transition-colors last:border-0 hover:bg-zinc-900/70"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-zinc-200">{row.name}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{row.date}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{row.category}</td>
                        <td className="px-6 py-4 font-mono text-zinc-300">{row.views}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 group-hover:text-zinc-100">
                            View
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
