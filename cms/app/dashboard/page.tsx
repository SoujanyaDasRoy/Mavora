'use client'
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, FileText, Users, HardDrive, RefreshCcw, Plus, ExternalLink
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { TwoLevelSidebar } from '@/components/ui/sidebar-component';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState<any>(null);
  // Articles state
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
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
    return () => { cancelled = true; };
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

  // Metric cards calculations
  const pageViews = stats?.pageViews30d ?? 0;
  const totalArticles = articles.length;
  const subscriberCount = stats?.subscriberCount ?? 0;
  const r2Used = stats ? (stats.r2UsedBytes / (1024 ** 3)).toFixed(2) : '0';
  const r2Limit = stats ? ((stats.r2FreeTierBytes ?? (10 * 1024 * 1024 * 1024)) / (1024 ** 3)).toFixed(0) : '10';

  // Chart data calculation
  const chartData = React.useMemo(() => {
    if (!articles.length) {
      return Array.from({ length: 14 }, (_, i) => ({
        day: `Day ${i + 1}`,
        articles: 0
      }));
    }
    const counts: Record<string, number> = {};
    articles.forEach(a => {
      const d = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([day, articles]) => ({ day, articles })).slice(-14);
  }, [articles]);

  const recentArticles = React.useMemo(() => {
    if (!articles.length) return [];
    return [...articles]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [articles]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <TwoLevelSidebar />

      {/* Main Content Area */}
      <main className="flex-1 pl-14 md:pl-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Overview of content performance.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/articles/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                New Article
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-zinc-800/80 text-sm font-medium -mt-2">
            {['Overview', 'Analytics', 'Settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 transition cursor-pointer ${
                  activeTab === tab 
                    ? 'border-indigo-500 text-white font-semibold' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Total Views</span>
                <TrendingUp className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {loading ? '...' : pageViews.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 mt-1">30 days aggregate</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Total Articles</span>
                <FileText className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {loading ? '...' : totalArticles}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Published and drafts</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Subscribers</span>
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {loading ? '...' : subscriberCount}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Newsletter list</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium uppercase tracking-wider">Storage</span>
                <HardDrive className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {loading ? '...' : `${r2Used} GB`}
                </div>
                <p className="text-xs text-zinc-500 mt-1">of {r2Limit} GB free tier</p>
              </div>
            </div>
          </div>

          {/* Analytics Overview Section */}
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
            <h2 className="text-base font-semibold text-white">Publishing Activity</h2>
            <div className="h-64 w-full pt-4">
              {loading ? (
                <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                  Loading activity...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                    />
                    <Bar dataKey="articles" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Articles Table */}
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Recent Articles</h2>
              <Link href="/articles" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View all <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 px-4">Pillar</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500">Loading articles...</td>
                    </tr>
                  ) : recentArticles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500">No articles created yet.</td>
                    </tr>
                  ) : (
                    recentArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3.5 pr-4 font-medium text-white max-w-xs truncate">
                          <Link href={`/articles/${article.id}`} className="hover:underline">
                            {article.title || 'Untitled Draft'}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 capitalize">{article.pillar || 'general'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            article.status === 'published' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {article.status || 'draft'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right text-zinc-500">
                          {new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
