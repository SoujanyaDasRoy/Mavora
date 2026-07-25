'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, FileText, Users, HardDrive, RefreshCcw, Plus, ExternalLink
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { TwoLevelSidebar } from '@/components/ui/sidebar-component'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('Overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [stats, setStats] = useState<any>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      const [statsResp, articlesResp] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/articles')
      ])
      if (!statsResp.ok) throw new Error(`Stats HTTP ${statsResp.status}`)
      if (!articlesResp.ok) throw new Error(`Articles HTTP ${articlesResp.status}`)
      const [statsData, articlesData] = await Promise.all([
        statsResp.json(),
        articlesResp.json()
      ])
      setStats(statsData as any)
      setArticles((articlesData as any[]) || [])
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  // Metrics
  const pageViews = stats?.pageViews30d ?? 0
  const totalArticles = articles.length
  const subscriberCount = stats?.subscriberCount ?? 0
  const r2Used = stats ? (stats.r2UsedBytes / (1024 ** 3)).toFixed(2) : '0'
  const r2Limit = stats ? ((stats.r2FreeTierBytes ?? (10 * 1024 * 1024 * 1024)) / (1024 ** 3)).toFixed(0) : '10'

  // Chart data
  const chartData = useMemo(() => {
    if (!articles.length) {
      return Array.from({ length: 14 }, (_, i) => ({
        day: `Day ${i + 1}`,
        articles: 0
      }))
    }
    const counts: Record<string, number> = {}
    articles.forEach(a => {
      const d = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      counts[d] = (counts[d] || 0) + 1
    })
    return Object.entries(counts).map(([day, articles]) => ({ day, articles })).slice(-14)
  }, [articles])

  const recentArticles = useMemo(() => {
    if (!articles.length) return []
    return [...articles]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [articles])

  return (
    <div className="flex min-h-screen bg-[#393836] text-[#f0f0f0] font-sans antialiased">
      {/* 25% Sidebar Partition */}
      <TwoLevelSidebar />

      {/* 75% Content Partition */}
      <main className="w-full md:w-3/4 md:ml-[25%] p-6 md:p-10 space-y-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4A4846] pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="text-sm text-[#b0b0b0] mt-1">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Here is your Mavora content overview.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#302F2D] border border-[#4A4846] text-xs font-semibold text-[#f0f0f0] hover:bg-[#272624] transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCcw className={`h-3.5 w-3.5 text-[#cf2743] ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/articles/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#cf2743] hover:bg-[#b31f38] text-xs font-bold text-white transition shadow-md shadow-[#cf2743]/20"
              >
                <Plus className="h-4 w-4" />
                New Article
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-[#4A4846] text-sm font-medium -mt-2">
            {['Overview', 'Analytics', 'Settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 transition cursor-pointer ${
                  activeTab === tab 
                    ? 'border-[#cf2743] text-white font-bold' 
                    : 'border-transparent text-[#b0b0b0] hover:text-[#f0f0f0]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-[#302F2D] border border-[#4A4846] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#b0b0b0]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#b0b0b0]">Total Views</span>
                <TrendingUp className="h-4 w-4 text-[#cf2743]" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? '...' : pageViews.toLocaleString()}
                </div>
                <p className="text-xs text-[#b0b0b0] mt-1 font-medium">30 days aggregate</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#302F2D] border border-[#4A4846] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#b0b0b0]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#b0b0b0]">Total Articles</span>
                <FileText className="h-4 w-4 text-[#cf2743]" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? '...' : totalArticles}
                </div>
                <p className="text-xs text-[#b0b0b0] mt-1 font-medium">Published & drafts</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#302F2D] border border-[#4A4846] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#b0b0b0]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#b0b0b0]">Subscribers</span>
                <Users className="h-4 w-4 text-[#cf2743]" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? '...' : subscriberCount}
                </div>
                <p className="text-xs text-[#b0b0b0] mt-1 font-medium">Newsletter list</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#302F2D] border border-[#4A4846] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[#b0b0b0]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#b0b0b0]">Storage</span>
                <HardDrive className="h-4 w-4 text-[#cf2743]" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? '...' : `${r2Used} GB`}
                </div>
                <p className="text-xs text-[#b0b0b0] mt-1 font-medium">of {r2Limit} GB free tier</p>
              </div>
            </div>
          </div>

          {/* Activity Chart Section */}
          <div className="p-6 rounded-2xl bg-[#302F2D] border border-[#4A4846] space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-white">Publishing Activity</h2>
            <div className="h-64 w-full pt-4">
              {loading ? (
                <div className="h-full flex items-center justify-center text-sm text-[#b0b0b0]">
                  Loading activity...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A4846" vertical={false} />
                    <XAxis dataKey="day" stroke="#b0b0b0" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#b0b0b0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#272624', borderColor: '#4A4846', borderRadius: '10px', fontSize: '12px', color: '#fff' }} 
                    />
                    <Bar dataKey="articles" fill="#cf2743" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Articles Section */}
          <div className="p-6 rounded-2xl bg-[#302F2D] border border-[#4A4846] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Recent Articles</h2>
              <Link href="/articles" className="text-xs font-semibold text-[#cf2743] hover:underline flex items-center gap-1">
                View all <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#4A4846] text-[#b0b0b0] font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 px-4">Pillar</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4A4846]/60 text-[#f0f0f0]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#b0b0b0]">Loading articles...</td>
                    </tr>
                  ) : recentArticles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#b0b0b0]">No articles created yet.</td>
                    </tr>
                  ) : (
                    recentArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-[#393836] transition">
                        <td className="py-3.5 pr-4 font-semibold text-white max-w-xs truncate">
                          <Link href={`/articles/${article.id}`} className="hover:text-[#cf2743] transition">
                            {article.title || 'Untitled Draft'}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            article.pillar === 'ai' ? 'bg-[#6C4BB4]/15 text-[#a78bfa] border border-[#6C4BB4]/30' :
                            article.pillar === 'technology' ? 'bg-[#1A7492]/15 text-[#38bdf8] border border-[#1A7492]/30' :
                            article.pillar === 'productivity' ? 'bg-[#2C7A3C]/15 text-[#4ade80] border border-[#2C7A3C]/30' :
                            'bg-[#CF2743]/15 text-[#f87171] border border-[#CF2743]/30'
                          }`}>
                            {article.pillar || 'general'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            article.status === 'published' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {article.status || 'draft'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right text-[#b0b0b0]">
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
  )
}
