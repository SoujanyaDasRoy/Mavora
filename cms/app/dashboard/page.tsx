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

function BorderBeam({ colorFrom = '#6366f1', colorTo = '#a855f7' }: { colorFrom?: string; colorTo?: string }) {
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
        <span className="text-2xl font-extrabold text-zinc-100">{Math.round(pct)}%</span>
        {label && <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">{label}</span>}
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

const tabs = ['Overview', 'Analytics', 'Settings'];

export default function DashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats state
  const [stats, setStats] = useState<any>(null);
  // Articles state
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Fetch stats and articles on load and refresh
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const [statsResp, articlesResp] = await Promise.all([
          fetch('/app/api/stats'),
          fetch('/app/api/articles')
        ]);
        if (!statsResp.ok) throw new Error(`Stats HTTP ${statsResp.status}`);
        if (!articlesResp.ok) throw new Error(`Articles HTTP ${articlesResp.status}`);
        const [statsData, articlesData] = await Promise.all([
          statsResp.json(),
          articlesResp.json()
        ]);
        if (!cancelled) {
          setStats(statsData as any);
          setArticles((articlesData as any[]) || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [statsResp, articlesResp] = await Promise.all([
        fetch('/app/api/stats'),
        fetch('/app/api/articles')
      ]);
      if (!statsResp.ok) throw new Error(`Stats HTTP ${statsResp.status}`);
      if (!articlesResp.ok) throw new Error(`Articles HTTP ${articlesResp.status}`);
      const [statsData, articlesData] = await Promise.all([
        statsResp.json(),
        articlesResp.json()
      ]);
      setStats(statsData as any);
      setArticles((articlesData as any[]) || []);
    } catch (err) {
      setError(true);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Prepare metric cards from stats
  const metricCards = React.useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: 'Total Views',
        icon: TrendingUp,
        val: stats.pageViews30d ?? 0,
        suffix: '',
        decimalPlaces: 0,
        trend: '+0.0%', // Placeholder
        trendType: 'neutral',
        sub: 'last 30 days'
      },
      {
        label: 'Published Articles',
        icon: FileText,
        val: stats.publishedCount ?? 0,
        suffix: '',
        decimalPlaces: 0,
        trend: '+0.0%',
        trendType: 'neutral',
        sub: 'total published'
      },
      {
        label: 'Draft Articles',
        icon: Search,
        val: stats.draftCount ?? 0,
        suffix: '',
        decimalPlaces: 0,
        trend: '+0.0%',
        trendType: 'neutral',
        sub: 'total drafts'
      },
      {
        label: 'Subscribers',
        icon: Users,
        val: stats.subscriberCount ?? 0,
        suffix: '',
        decimalPlaces: 0,
        trend: '+0.0%',
        trendType: 'neutral',
        sub: 'newsletter subscribers'
      },
      {
        label: 'Storage Used',
        icon: Clock,
        val: stats.r2UsedBytes ?? 0,
        max: stats.r2FreeTierBytes ?? (10 * 1024 * 1024 * 1024),
        suffix: '',
        decimalPlaces: 2,
        trend: '+0.0%',
        trendType: 'neutral',
        sub: `of ${((stats?.r2FreeTierBytes ?? (10 * 1024 * 1024 * 1024)) / (1024 ** 3)).toFixed(1)} GB`
      },
    ];
  }, [stats]);
  
  // Prepare chart and table data from articles
  const pillarDistribution = React.useMemo(() => {
    if (!articles.length) return [];
    const counts: Record<string, number> = { ai: 0, technology: 0, productivity: 0, business: 0 };
    articles.forEach(a => {
      if (a.pillar in counts) {
        counts[a.pillar] = (counts[a.pillar] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: name === 'ai' ? '#6366f1' : name === 'technology' ? '#a855f7' : name === 'productivity' ? '#ec4899' : '#64748b',
    }));
  }, [articles]);
  
  const dailyArticleCounts = React.useMemo(() => {
    if (!articles.length) return Array.from({ length: 30 }, (_, i) => ({
      name: '',
      views: 0,
      volume: 0,
    }));
    
    // Group articles by createdAt date (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const counts: Record<string, number> = {};
    articles.forEach(a => {
      const created = new Date(a.createdAt);
      if (created >= thirtyDaysAgo && created <= today) {
        const dateStr = created.toISOString().slice(0, 10); // YYYY-MM-DD
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    
    // Create array for last 30 days (descending order: most recent first)
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const count = counts[dateStr] || 0;
      // Format date as day name (Mon, Tue, etc.)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      result.push({
        name: dayName,
        views: count, // Using views for article count
        volume: 0, // volume unused
      });
    }
    // Reverse to get chronological order (oldest first) for chart
    return result.reverse();
  }, [articles]);
  
  const recentArticles = React.useMemo(() => {
    if (!articles.length) return [];
    // Sort by updatedAt descending
    const sorted = [...articles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    // Take top 4
    const top4 = sorted.slice(0, 4);
    // Map to table format
    return top4.map(article => ({
      id: article.id,
      title: article.title,
      // We don't have category in article; we can use pillar as category
      category: article.pillar.charAt(0).toUpperCase() + article.pillar.slice(1),
      views: '—', // We don't have view count per article; could fetch from analytics but not available
      status: article.status,
      date: new Date(article.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      author: article.authorName || (user?.firstName || 'User'), // Use authorName from article, fallback to current user
    }));
  }, [articles, user]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
        <AnimatedGridPattern />
        <TwoLevelSidebar activeSection="dashboard" />
        <div className="relative flex-1 min-w-0 overflow-x-hidden">
          <main className="w-full p-6 md:p-10 lg:p-12">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                <p className="mt-4 text-zinc-400">Loading dashboard...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
        <AnimatedGridPattern />
        <TwoLevelSidebar activeSection="dashboard" />
        <div className="relative flex-1 min-w-0 overflow-x-hidden">
          <main className="w-full p-6 md:p-10 lp-12">
            <div className="text-center">
              <p className="text-zinc-400">Error loading dashboard data. Please try again.</p>
              <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
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
              {metricCards.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 lg:p-7 backdrop-blur-sm"
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
                        <NumberTicker value={metric.val} decimalPlaces={metric.decimalPlaces} suffix={metric.suffix} />
                      ) : (
                        <span className="text-3xl lg:text-4xl font-extrabold text-zinc-50 tracking-tight">{(metric as any).valStr}</span>
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
                      </span>
                      <span className="text-xs text-zinc-500">{metric.sub}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* 4. Charts (using real data from articles) */}
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
                    <BarChart data={dailyArticleCounts} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={6}>
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
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm flex-1">
                  <h3 className="font-semibold text-white mb-6">Content Distribution</h3>
                  <div className="space-y-5">
                    {pillarDistribution.map((item, index) => (
                      <div key={item.name}>
                        <div className="flex justify-between mb-1.5 text-xs text-zinc-400">
                          <span className="capitalize">{item.name}</span>
                          <span className="font-mono font-medium text-zinc-200">{item.value}%</span>
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
                    <AnimatedCircularProgressBar 
                      value={stats ? (stats.r2UsedBytes / stats.r2FreeTierBytes) * 100 : 0} 
                      max={100} 
                      gaugePrimaryColor="#f59e0b" 
                      gaugeSecondaryColor="#27272a" 
                      label="Used" 
                    />
                  </div>
                  <p className="mt-4 text-sm font-medium text-amber-500">
                    {stats ? ((stats.r2UsedBytes / (1024 ** 3)).toFixed(1)) : 0} GB of 
                    {stats ? ((stats.r2FreeTierBytes ?? (10 * 1024 * 1024 * 1024)) / (1024 ** 3)).toFixed(1) : 0} GB
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Recent Articles Table (using real data from articles) */}
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-800/60">
                <h3 className="font-semibold text-white">Recent Articles</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800/60 text-[11px] uppercase font-semibold text-zinc-400 tracking-wider sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Article Title</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Published Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {recentArticles.map((row, i) => (
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
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            row.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            row.status === 'Draft' ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40' :
                            row.status === 'Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400/20'
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
