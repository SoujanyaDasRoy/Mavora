'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArticleTable, type ArticleRow } from '@/components/ArticleTable'
import { AdminHeader } from '@/components/AdminHeader'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState(false)

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
      setArticles(data)
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
    if (!window.confirm('Delete this article? This cannot be undone.')) return

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

  return (
    <div className="admin-layout">
      <AdminHeader />
      <main className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>Manage Articles</h1>
          <Link href="/articles/new" className="btn btn-primary">
            + New Article
          </Link>
        </div>

        {loading && (
          <div className="state-container">
            <div className="state-title">Loading articles...</div>
            <div className="state-desc">Fetching article list from D1 database...</div>
          </div>
        )}

        {loadError && (
          <div className="state-container" style={{ borderColor: 'var(--color-accent)' }}>
            <div className="state-title" style={{ color: 'var(--color-accent)' }}>Failed to load articles</div>
            <div className="state-desc">There was an issue connecting to the database.</div>
          </div>
        )}

        {deleteError && (
          <p style={{ color: 'var(--color-accent)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Failed to delete the article. Only the author or an admin can delete articles.
          </p>
        )}

        {!loading && !loadError && (
          <div className="table-wrapper">
            <ArticleTable articles={articles} onDelete={handleDelete} deletingId={deletingId} />
          </div>
        )}
      </main>
    </div>
  )
}
