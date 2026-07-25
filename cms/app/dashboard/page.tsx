'use client'
import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users, MousePointerClick, Clock, RefreshCcw, Plus } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { TwoLevelSidebar } from '@/components/ui/sidebar-component';

// --- Magic UI Components ---

function NumberTicker({ value, decimalPlaces = 0, prefix = '', suffix = '' }: { value: number; decimalPlaces?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { damping: 60, stiffness: 100 })
  const isInView = useInView(ref, { once: true, margin: '0px' })
  useEffect(() => { if (isInView) motionVal.set(value) }, [motionVal, isInView, value])
  useEffect(() => spring.on('change', (latest) => {
    if (ref.current) ref.current.textContent = prefix + Intl.NumberFormat('en-US', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(Number(latest.toFixed(decimalPlaces))) + suffix
  }), [spring, decimalPlaces, prefix, suffix])
  return <span ref={ref} />
}

function BorderBeam({ colorFrom = '#6366f1', colorTo = '#a855f7' }: { colorFrom?: string; colorTo?: string; size?: number; duration?: number; delay?: number; borderWidth?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{
        background: `linear-gradient(var(--angle, 45deg), ${colorFrom}, ${colorTo}) border-box`,
        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out',
        maskComposite: 'exclude',
        border: '1px solid transparent',
      }}
    />
  )
}

function AnimatedCircularProgressBar({ value, max, gaugePrimaryColor, gaugeSecondaryColor, label }: { value: number; max: number; gaugePrimaryColor: string; gaugeSecondaryColor: string; label?: string }) {
  const pct = (value / max) * 100
  const radius = 45
  const circ = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circ
  return (
    <div className="relative flex items-center justify-center w-[80px] h-[80px] md:w-[100px] md:h-[100px] lg:w-[120px] lg:h-[120px]">
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={gaugeSecondaryColor} strokeWidth="10" />
        <motion.circle cx="60" cy="60" r={radius} fill="none" stroke={gaugePrimaryColor} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: circ - strokeDash }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-zinc-100">{Math.round(pct)}%</span>
        {label && <span className="text-xs text-zinc-500">{label}</span>}
      </div>
    </div>
  )
}

function ShimmerButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-100 transition-all hover:scale-[1.02] ${className}`}
      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="absolute inset-0 -top-1/2 flex h-[200%] w-full animate-[spin_3s_linear_infinite] items-center justify-center opacity-60">
        <div className="h-[50%] w-[30%] rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0%, transparent 50%, #e2e8f0 50%, #e2e8f0 60%, transparent 60%)' }} />
      </div>
      <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] bg-zinc-900" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}

function AnimatedGridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

// --- Data ---
const chartData = [
  { name: 'Mon', views: 4000, volume: 2400 },
  { name: 'Tue', views: 3000, volume: 1398 },
  { name: 'Wed', views: 2000, volume: 9800 },
  { name: 'Thu', views: 2780, volume: 3908 },
  { name: 'Fri', views: 1890, volume: 4800 },
  { name: 'Sat', views: 2390, volume: 3800 },
  { name: 'Sun', views: 3490, volume: 4300 },
];

const donutData = [
  { name: 'Articles', value: 45, color: '#6366f1' },
  { name: 'Videos', value: 30, color: '#a855f7' },
  { name: 'Podcasts', value: 15, color: '#ec4899' },
  { name: 'Other', value: 10, color: '#64748b' },
];

const tableData = [
  { id: 1, title: 'Getting Started with Next.js', status: 'Published', date: '2023-10-25', author: 'John Doe' },
  { id: 2, title: 'Understanding React Server Components', status: 'Draft', date: '2023-10-26', author: 'Jane Smith' },
  { id: 3, title: 'Tailwind CSS Tips and Tricks', status: 'Review', date: '2023-10-27', author: 'Alice Johnson' },
  { id: 4, title: 'Deploying to Vercel', status: 'Archived', date: '2023-10-28', author: 'Bob Brown' },
];

const tabs = ['Overview', 'Analytics', 'Settings'];

export default function DashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <AnimatedGridPattern />
      {/* Two-level Carbon sidebar: icon rail + collapsible detail panel */}
      <TwoLevelSidebar activeSection="dashboard" />
      
      <div className="relative flex-1 min-w-0 overflow-x-hidden">
        <main className="w-full p-6 md:p-10 lg:p-12">
          <div className="space-y-10">
            {/* Header */}
            <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {user?.firstName || 'User'}</h1>
                <p className="mt-1 text-zinc-400">Here&apos;s what&apos;s happening with your projects today.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center justify-center p-2.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-zinc-400 hover:text-white transition-colors">
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <ShimmerButton>
                  <Plus className="h-4 w-4" />
                  New Project
                </ShimmerButton>
              </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-zinc-800/60 pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Views', icon: TrendingUp, val: 2400000, display: '2.4M', suffix: 'M', decimalPlaces: 1, divisor: 1000000, trend: '↑12.3%', trendColor: 'text-emerald-400 bg-emerald-400/10' },
                { label: 'Active Users', icon: Users, val: 48291, display: '48,291', trend: '↑8.1%', trendColor: 'text-emerald-400 bg-emerald-400/10' },
                { label: 'Bounce Rate', icon: MousePointerClick, val: 42.8, display: '42.8%', suffix: '%', decimalPlaces: 1, trend: '↓2.4%', trendColor: 'text-rose-400 bg-rose-400/10' },
                { label: 'Avg. Session', icon: Clock, valStr: '4m 12s', display: '4m 12s', trend: '→0.0%', trendColor: 'text-zinc-400 bg-zinc-400/10' }
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm"
                >
                  <BorderBeam colorFrom="#818cf8" colorTo="#c084fc" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium">{metric.label}</h3>
                    <metric.icon className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-zinc-100">
                      {metric.val !== undefined ? (
                        <NumberTicker value={metric.divisor ? metric.val / metric.divisor : metric.val} decimalPlaces={metric.decimalPlaces} suffix={metric.suffix} />
                      ) : (
                        metric.valStr
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mb-1 ${metric.trendColor}`}>
                      {metric.trend}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Analytics Overview</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500" /> Views</div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-purple-500" /> Volume</div>
                  </div>
                </div>
                <div className="h-[240px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <RechartsTooltip cursor={{ fill: '#27272a', opacity: 0.4 }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                      <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="volume" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm flex-1">
                  <h3 className="font-semibold text-white mb-6">Content Distribution</h3>
                  <div className="space-y-5">
                    {donutData.map((item, index) => (
                      <div key={item.name}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm text-zinc-400">{item.name}</span>
                          <span className="text-sm font-mono text-zinc-200">{item.value}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm flex flex-col items-center justify-center relative">
                  <h3 className="font-semibold text-white absolute top-6 left-6">Storage</h3>
                  <div className="mt-8">
                    <AnimatedCircularProgressBar value={68.4} max={100} gaugePrimaryColor="#f59e0b" gaugeSecondaryColor="#27272a" label="Used" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-amber-500">68.4 GB / 100 GB</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-800/60">
                <h3 className="font-semibold text-white">Recent Articles</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Title</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Author</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, i) => (
                      <motion.tr 
                        key={row.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="border-b border-zinc-800/60 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-zinc-100">{row.title}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            row.status === 'Published' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                            row.status === 'Draft' ? 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20' :
                            row.status === 'Review' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                            'bg-rose-400/10 text-rose-400 border-rose-400/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{row.date}</td>
                        <td className="px-6 py-4">{row.author}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
