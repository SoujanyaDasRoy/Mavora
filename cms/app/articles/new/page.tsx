'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// BlockNote touches `window` during editor initialization, so it can't be
// server-rendered. Load it client-side only to avoid a prerender failure.
const BlockEditor = dynamic(() => import('@/components/BlockEditor').then((mod) => mod.BlockEditor), {
  ssr: false,
})

const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState<(typeof PILLARS)[number]>('ai')
  const [articleId, setArticleId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function createDraftIfNeeded(): Promise<string> {
    if (articleId) return articleId
    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Untitled', pillar }),
    })
    const article = (await response.json()) as { id: string }
    setArticleId(article.id)
    return article.id
  }

  const handleEditorChange = useCallback(
    async (json: string) => {
      setSaveStatus('saving')
      const id = await createDraftIfNeeded()
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocknoteContent: json }),
      })
      setSaveStatus('saved')
    },
    [articleId, title, pillar]
  )

  return (
    <main>
      <h1>New Article</h1>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={createDraftIfNeeded}
      />
      <select value={pillar} onChange={(e) => setPillar(e.target.value as (typeof PILLARS)[number])}>
        {PILLARS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <p>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}</p>
      <BlockEditor initialContent="[]" onChange={handleEditorChange} />
      {articleId && (
        <button onClick={() => router.push(`/articles/${articleId}`)}>
          Continue editing (SEO fields, cover image, publish)
        </button>
      )}
    </main>
  )
}
