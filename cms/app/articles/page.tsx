'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { TwoLevelSidebar } from '@/components/ui/sidebar-component'
import { Plus, Search, Trash2, Edit3, RefreshCcw, FileText } from 'lucide-react'

export interface ArticleRow {
  id: string
  title: string
  pillar: string
  status: 'draft' | 'published'
  updatedAt: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState(false)
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [pillarFilter, setPillarFilter] = useState<string>('all')

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const response = await fetch('/api/articles')
      if (!response.ok) {
        setLoadError(true)
        return
      }
      const data = (await response.json()) as ArticleRow[]
      setArticles(data || [])
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) return

    setDeleteError(false)
    setDeletingId(id)
    try {
      const response = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        setDeleteError(true)
        return
      }
      await loadArticles()
    } catch {
      setDeleteError(true)
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered articles calculation
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (statusFilter !== 'all' && article.status !== statusFilter) return false
      if (pillarFilter !== 'all' && article.pillar?.toLowerCase() !== pillarFilter.toLowerCase()) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchTitle = article.title?.toLowerCase().includes(query)
        const matchPillar = article.pillar?.toLowerCase().includes(query)
        if (!matchTitle && !matchPillar) return false
      }
      return true
    })
  }, [articles, statusFilter, pillarFilter, searchQuery])

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
                Articles
              </h1>
              <p className="text-sm text-[#b0b0b0] mt-1">
                Manage, edit, publish, and delete your Mavora articles.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadArticles}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#302F2D] border border-[#4A4846] text-xs font-semibold text-[#f0f0f0] hover:bg-[#272624] transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCcw className={`h-3.5 w-3.5 text-[#cf2743] ${loading ? 'animate-spin' : ''}`} />
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

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#302F2D] border border-[#4A4846]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b0b0b0]" />
              <input
                type="text"
                placeholder="Search articles by title or pillar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#393836] border border-[#4A4846] text-xs text-white placeholder-[#b0b0b0] focus:outline-none focus:border-[#cf2743] transition"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center bg-[#393836] p-1 rounded-xl border border-[#4A4846] text-xs">
                {(['all', 'published', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg capitalize font-bold transition cursor-pointer ${
                      statusFilter === status 
                        ? 'bg-[#cf2743] text-white' 
                        : 'text-[#b0b0b0] hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Pillar Select */}
              <select
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#393836] border border-[#4A4846] text-xs font-semibold text-white focus:outline-none focus:border-[#cf2743] transition cursor-pointer capitalize"
              >
                <option value="all">All Pillars</option>
                <option value="ai">AI</option>
                <option value="technology">Technology</option>
                <option value="productivity">Productivity</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          {/* Delete Error Notification */}
          {deleteError && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-400">
              Failed to delete article. Ensure you have proper permissions or try again.
            </div>
          )}

          {/* Table Container */}
          <div className="rounded-2xl bg-[#302F2D] border border-[#4A4846] overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-sm text-[#b0b0b0] space-y-2">
                <RefreshCcw className="h-6 w-6 animate-spin mx-auto text-[#cf2743] mb-2" />
                <p className="font-bold text-white">Loading articles...</p>
                <p className="text-xs text-[#b0b0b0]">Fetching list from D1 database</p>
              </div>
            ) : loadError ? (
              <div className="p-12 text-center text-sm text-rose-400 space-y-2">
                <p className="font-extrabold text-base">Failed to load articles</p>
                <p className="text-xs text-[#b0b0b0]">There was an error connecting to the database.</p>
                <button 
                  onClick={loadArticles} 
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#393836] text-white hover:bg-[#cf2743] text-xs font-bold transition"
                >
                  Try Again
                </button>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#b0b0b0] space-y-3">
                <FileText className="h-8 w-8 mx-auto text-[#b0b0b0]" />
                <p className="font-extrabold text-white text-base">No articles found</p>
                <p className="text-xs text-[#b0b0b0] max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all' || pillarFilter !== 'all'
                    ? 'No articles match your current search and filter settings.'
                    : 'Get started by creating your first article.'}
                </p>
                <Link
                  href="/articles/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#cf2743] hover:bg-[#b31f38] text-xs font-bold text-white transition mt-2 shadow-md shadow-[#cf2743]/20"
                >
                  <Plus className="h-4 w-4" />
                  Create Article
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#4A4846] text-[#b0b0b0] font-bold uppercase tracking-wider bg-[#272624]">
                      <th className="py-4 px-6">Article Title</th>
                      <th className="py-4 px-4">Pillar</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Last Updated</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4A4846]/60 text-[#f0f0f0]">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-[#393836] transition">
                        <td className="py-4 px-6 font-semibold text-white max-w-md truncate">
                          <Link href={`/articles/${article.id}`} className="hover:text-[#cf2743] transition">
                            {article.title || 'Untitled Draft'}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            article.pillar === 'ai' ? 'bg-[#6C4BB4]/15 text-[#a78bfa] border border-[#6C4BB4]/30' :
                            article.pillar === 'technology' ? 'bg-[#1A7492]/15 text-[#38bdf8] border border-[#1A7492]/30' :
                            article.pillar === 'productivity' ? 'bg-[#2C7A3C]/15 text-[#4ade80] border border-[#2C7A3C]/30' :
                            'bg-[#CF2743]/15 text-[#f87171] border border-[#CF2743]/30'
                          }`}>
                            {article.pillar || 'general'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            article.status === 'published' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {article.status || 'draft'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[#b0b0b0]">
                          {new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/articles/${article.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#393836] hover:bg-[#cf2743] text-white transition text-xs font-bold"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(article.id)}
                              disabled={deletingId === article.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition text-xs font-bold border border-rose-500/30 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === article.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
