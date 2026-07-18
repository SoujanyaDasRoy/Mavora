'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// BlockNote touches `window` during editor initialization, so it can't be
// server-rendered. Load it client-side only to avoid a prerender failure.
const BlockEditor = dynamic(() => import('@/components/BlockEditor').then((mod) => mod.BlockEditor), {
  ssr: false,
})

interface ArticleData {
  id: string
  title: string
  blocknoteContent: string
  seoTitle: string | null
  seoDescription: string | null
  coverImage: string | null
  status: 'draft' | 'published'
}

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle')

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json as ArticleData
        setArticle(data)
        setSeoTitle(data.seoTitle ?? '')
        setSeoDescription(data.seoDescription ?? '')
      })
  }, [id])

  const handleEditorChange = useCallback(
    async (json: string) => {
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocknoteContent: json }),
      })
    },
    [id]
  )

  async function saveSeoFields() {
    await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seoTitle, seoDescription }),
    })
  }

  async function handlePublish() {
    setPublishStatus('publishing')
    await saveSeoFields()
    const response = await fetch(`/api/articles/${id}/publish`, { method: 'POST' })
    setPublishStatus(response.ok ? 'published' : 'error')
  }

  if (!article) return <main>Loading...</main>

  return (
    <main>
      <h1>{article.title}</h1>
      <label htmlFor="seo-title">SEO title</label>
      <input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} onBlur={saveSeoFields} />
      <label htmlFor="seo-description">SEO description</label>
      <textarea
        id="seo-description"
        value={seoDescription}
        onChange={(e) => setSeoDescription(e.target.value)}
        onBlur={saveSeoFields}
      />
      <BlockEditor initialContent={article.blocknoteContent} onChange={handleEditorChange} />
      <button onClick={handlePublish} disabled={publishStatus === 'publishing'}>
        {article.status === 'published' ? 'Update published article' : 'Publish'}
      </button>
      {publishStatus === 'published' && <p>Published.</p>}
      {publishStatus === 'error' && <p>Publish failed.</p>}
    </main>
  )
}
