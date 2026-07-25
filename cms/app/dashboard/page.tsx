'use client'
import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, MousePointerClick, Clock, 
  RefreshCcw, Plus, ArrowUpRight, ArrowDownRight, ArrowRight, Search, FileText, ChevronRight
} from 'lucide-react';
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

function BorderBeam({ colorFrom = '#818cf8', colorTo = '#c084fc' }: { colorFrom?: string; colorTo?: string }) {
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
  const radius = 42
  const circ = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circ
  return (
    <div className="relative flex items-center justify-center w-[110px] h-[110px]">
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
        <span className="text-2xl font-extrabold text-zinc-100">{Math.round(pct)}%</span>
        {label && <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">{label}</span>}
      </div>
    </div>
  )
}

function ShimmerButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-500/10 ${className}`}
      style={{ border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="absolute inset-0 -top-1/2 flex h-[200%] w-full animate-[spin_3s_linear_infinite] items-center justify-center opacity-60">
        <div className="h-[50%] w-[30%] rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0%, transparent 50%, #818cf8 50%, #c084fc 60%, transparent 60%)' }} />
      </div>
      <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-zinc-900" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}

function AnimatedGridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.025]">
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

// --- Mock Data ---
const chartData = [
  { name: 'Mon', views: 4200, volume: 2400 },
  { name: 'Tue', views: 5100, volume: 2800 },
  { name: 'Wed', views: 7800, volume: 4900 },
  { name: 'Thu', views: 6200, volume: 3908 },
  { name: 'Fri', views: 8900, volume: 5800 },
  { name: 'Sat', views: 7390, volume: 4800 },
  { name: 'Sun', views: 9490, volume: 6300 },
];

const donutData = [
  { name: 'Articles', value: 45, color: '#6366f1' },
  { name: 'Videos', value: 30, color: '#a855f7' },
  { name: 'Podcasts', value: 15, color: '#ec4899' },
  { name: 'Other', value: 10, color: '#64748b' },
];

const tableData = [
  { id: 1, title: 'Getting Started with Next.js 16 App Router', category: 'Engineering', status: 'Published', views: '14,290', date: 'Oct 25, 2024', author: 'John Doe' },
  { id: 2, title: 'Understanding React Server Components Deep Dive', category: 'Architecture', status: 'Draft', views: '—', date: 'Oct 26, 2024', author: 'Jane Smith' },
  { id: 3, title: 'Tailwind CSS v4 Utility First Design Systems', category: 'Design', status: 'Review', views: '3,840', date: 'Oct 27, 2024', author: 'Alice Johnson' },
  { id: 4, title: 'Deploying High-Scale Workers to Cloudflare Edge', category: 'DevOps', status: 'Published', views: '28,510', date: 'Oct 28, 2024', author: 'Bob Brown' },
];

const tabs = ['Overview', 'Analytics', 'Settings'];

export default function DashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredArticles = tableData.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      <AnimatedGridPattern />
      
      {/* Two-level Carbon sidebar */}
      <TwoLevelSidebar activeSection="dashboard" />
      
      <div className="relative flex-1 min-w-0 overflow-x-hidden">
        <main className="w-full p-6 md:p-10 lg:p-12">
          <div className="space-y-8 lg:space-y-10">
            
            {/* 1. Header Section */}
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-800/40 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    Welcome back, {user?.firstName || 'Soujanya'} 👋
                  </h1>
                </div>
                <p className="text-sm lg:text-base text-zinc-400 font-normal">
                  Here&apos;s a high-level overview of your platform performance and active projects.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-auto">
                <button 
                  onClick={handleRefresh}
                  className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700/60 transition-all duration-200 shadow-sm"
                >
                  <RefreshCcw className={`h-4 w-4 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                
                <ShimmerButton>
                  <Plus className="h-4 w-4 text-indigo-400" />
                  <span>New Project</span>
                </ShimmerButton>
              </div>
            </header>

            {/* 2. Navigation Tabs */}
            <div className="flex items-center gap-8 border-b border-zinc-800/60 -mt-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* 3. Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Total Views', 
                  icon: TrendingUp, 
                  val: 2400000, 
                  suffix: 'M', 
                  decimalPlaces: 1, 
                  divisor: 1000000, 
                  trend: '+12.3%', 
                  trendType: 'up',
                  sub: 'vs last month' 
                },
                { 
                  label: 'Active Users', 
                  icon: Users, 
                  val: 48291, 
                  suffix: '', 
                  decimalPlaces: 0, 
                  trend: '+8.1%', 
                  trendType: 'up',
                  sub: 'vs last month' 
                },
                { 
                  label: 'Bounce Rate', 
                  icon: MousePointerClick, 
                  val: 42.8, 
                  suffix: '%', 
                  decimalPlaces: 1, 
                  trend: '-2.4%', 
                  trendType: 'down',
                  sub: 'improved 2.4%' 
                },
                { 
                  label: 'Avg. Session', 
                  icon: Clock, 
                  valStr: '4m 12s', 
                  trend: '0.0%', 
                  trendType: 'neutral',
                  sub: 'steady retention' 
                }
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 lg:p-7 backdrop-blur-md shadow-lg shadow-black/20 transition-all duration-300 hover:border-zinc-700/60 hover:-translate-y-0.5"
                >
                  <BorderBeam colorFrom="#818cf8" colorTo="#c084fc" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest font-semibold text-zinc-400">{metric.label}</span>
                    <div className="p-2 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      <metric.icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-3xl lg:text-4xl font-extrabold text-zinc-50 tracking-tight">
                      {metric.val !== undefined ? (
                        <NumberTicker value={metric.divisor ? metric.val / metric.divisor : metric.val} decimalPlaces={metric.decimalPlaces} suffix={metric.suffix} />
                      ) : (
                        metric.valStr
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        metric.trendType === 'up' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : metric.trendType === 'down'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'
                      }`}>
                        {metric.trendType === 'up' && <ArrowUpRight className="h-3 w-3" />}
                        {metric.trendType === 'down' && <ArrowDownRight className="h-3 w-3" />}
                        {metric.trendType === 'neutral' && <ArrowRight className="h-3 w-3" />}
                        {metric.trend}
                      </span>
                      <span className="text-xs text-zinc-500">{metric.sub}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 4. Analytics Section (Balanced 70 / 30 Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Main Analytics Chart (70% width ~ lg:col-span-8) */}
              <div className="lg:col-span-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 lg:p-8 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Analytics Overview</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Content views and interaction volume over the past 7 days</p>
                    </div>
                    
                    <div className="flex items-center gap-5 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        <span className="text-zinc-300">Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        <span className="text-zinc-300">Volume</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] lg:h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#27272a', opacity: 0.3 }} 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderColor: '#3f3f46', 
                          borderRadius: '12px', 
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                          color: '#f4f4f5'
                        }} 
                      />
                      <Bar dataKey="views" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="volume" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Sidebar Widgets (30% width ~ lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Content Distribution */}
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-xl shadow-black/20 flex-1">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-white tracking-tight">Content Distribution</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Share by published content category</p>
                  </div>

                  <div className="space-y-4">
                    {donutData.map((item, index) => (
                      <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">{item.name}</span>
                          </div>
                          <span className="font-mono text-zinc-400 font-semibold">{item.value}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden p-0.5 border border-zinc-800">
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

                {/* Storage Capacity */}
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col items-center justify-center relative min-h-[220px]">
                  <div className="w-full flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white tracking-tight">Storage Capacity</h3>
                    <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">68% Used</span>
                  </div>

                  <div className="my-3">
                    <AnimatedCircularProgressBar value={68.4} max={100} gaugePrimaryColor="#f59e0b" gaugeSecondaryColor="#27272a" label="Used" />
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-300">68.4 GB of 100 GB used</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">31.6 GB storage remaining</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 5. Recent Articles Table */}
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md overflow-hidden shadow-xl shadow-black/20">
              <div className="p-6 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Recent Articles</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Latest performance metrics and publishing status across content</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800/60 text-[11px] uppercase font-semibold text-zinc-400 tracking-wider sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Article Title</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold">Views</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Published Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {filteredArticles.map((row, i) => (
                      <motion.tr 
                        key={row.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="hover:bg-zinc-800/30 transition-colors duration-150 group cursor-pointer"
                      >
                        <td className="px-6 py-4 font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 text-zinc-500 shrink-0 group-hover:text-indigo-400" />
                            <span>{row.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/40 font-medium">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-medium text-zinc-300">{row.views}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            row.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            row.status === 'Draft' ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40' :
                            row.status === 'Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              row.status === 'Published' ? 'bg-emerald-400 animate-pulse' :
                              row.status === 'Draft' ? 'bg-zinc-500' :
                              row.status === 'Review' ? 'bg-amber-400' :
                              'bg-rose-400'
                            }`} />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">{row.date}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-indigo-400 transition-colors">
                            <span>View Details</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
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
