'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { TwoLevelSidebar } from '@/components/ui/sidebar-component'
import { Plus, Search, Filter, Trash2, Edit3, ExternalLink, RefreshCcw, FileText } from 'lucide-react'

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
      // Status filter
      if (statusFilter !== 'all' && article.status !== statusFilter) return false
      // Pillar filter
      if (pillarFilter !== 'all' && article.pillar?.toLowerCase() !== pillarFilter.toLowerCase()) return false
      // Search query
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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      <TwoLevelSidebar />

      <main className="flex-1 md:pl-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Articles
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Manage, edit, publish, and delete CMS articles.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadArticles}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
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

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search articles by title or pillar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                {(['all', 'published', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                      statusFilter === status 
                        ? 'bg-zinc-800 text-white font-semibold' 
                        : 'text-zinc-400 hover:text-zinc-200'
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
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer capitalize"
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
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400">
              Failed to delete article. Ensure you have proper permissions or try again.
            </div>
          )}

          {/* Table / Content List */}
          <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-zinc-500 space-y-2">
                <RefreshCcw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
                <p className="font-medium text-zinc-300">Loading articles...</p>
                <p className="text-xs text-zinc-500">Fetching list from database</p>
              </div>
            ) : loadError ? (
              <div className="p-12 text-center text-sm text-rose-400 space-y-2">
                <p className="font-semibold text-base">Failed to load articles</p>
                <p className="text-xs text-zinc-500">There was an error connecting to the database.</p>
                <button 
                  onClick={loadArticles} 
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 hover:text-white text-xs"
                >
                  Try Again
                </button>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-12 text-center text-sm text-zinc-500 space-y-3">
                <FileText className="h-8 w-8 mx-auto text-zinc-600" />
                <p className="font-semibold text-zinc-300 text-base">No articles found</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all' || pillarFilter !== 'all'
                    ? 'No articles match your current search and filter settings.'
                    : 'Get started by creating your first article.'}
                </p>
                <Link
                  href="/articles/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition mt-2 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Create Article
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider bg-zinc-900/80">
                      <th className="py-3.5 px-6">Article Title</th>
                      <th className="py-3.5 px-4">Pillar</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Last Updated</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-4 px-6 font-medium text-white max-w-md truncate">
                          <Link href={`/articles/${article.id}`} className="hover:text-indigo-400 transition">
                            {article.title || 'Untitled Draft'}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {article.pillar || 'general'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            article.status === 'published' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
                          }`}>
                            {article.status || 'draft'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-zinc-400">
                          {new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/articles/${article.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition text-xs font-medium"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(article.id)}
                              disabled={deletingId === article.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition text-xs font-medium border border-rose-500/20 disabled:opacity-50 cursor-pointer"
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
