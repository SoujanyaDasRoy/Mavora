'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArticleTable, type ArticleRow } from '@/components/ArticleTable'

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
      // Re-fetch from the server rather than removing the row locally, so
      // the list reflects the actual server state (e.g. if another session
      // deleted or modified the same article concurrently).
      await loadArticles()
    } catch {
      setDeleteError(true)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main>
      <h1>Manage Articles</h1>
      <Link href="/articles/new">New Article</Link>
      {loading && <p>Loading...</p>}
      {loadError && <p>Failed to load articles.</p>}
      {deleteError && <p>Failed to delete article.</p>}
      {!loading && !loadError && (
        <ArticleTable articles={articles} onDelete={handleDelete} deletingId={deletingId} />
      )}
    </main>
  )
}
