'use client'

import Link from 'next/link'

export interface ArticleRow {
  id: string
  title: string
  pillar: string
  status: 'draft' | 'published'
  updatedAt: string
}

interface ArticleTableProps {
  articles: ArticleRow[]
  onDelete: (id: string) => void
  deletingId?: string | null
}

export function ArticleTable({ articles, onDelete, deletingId }: ArticleTableProps) {
  if (articles.length === 0) {
    return <p>No articles yet.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Pillar</th>
          <th>Status</th>
          <th>Last updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr key={article.id}>
            <td>{article.title}</td>
            <td>{article.pillar}</td>
            <td>{article.status}</td>
            <td>{new Date(article.updatedAt).toLocaleDateString()}</td>
            <td>
              <Link href={`/articles/${article.id}`}>Edit</Link>{' '}
              <button
                type="button"
                onClick={() => onDelete(article.id)}
                disabled={deletingId === article.id}
              >
                {deletingId === article.id ? 'Deleting...' : 'Delete'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
