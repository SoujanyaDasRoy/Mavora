'use client'

import { useEffect, useState, useCallback, type ChangeEvent } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'

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
  const [coverUploadStatus, setCoverUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  // Stable across renders (unlike an inline arrow function), so it's a safe
  // identity for BlockEditor's getArticleId prop; the id itself is already
  // always available on this page (unlike New Article, no lazy creation
  // needed).
  const getArticleId = useCallback(async () => id, [id])

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

  async function handleCoverImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploadStatus('uploading')
    setCoverUploadError(null)
    try {
      const media = await uploadMediaFile(id, file, `Cover image for ${article?.title ?? 'Untitled'}`)
      const publicUrl = getPublicMediaUrl(media.r2Key)
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImage: publicUrl }),
      })
      setArticle((prev) => (prev ? { ...prev, coverImage: publicUrl } : prev))
      setCoverUploadStatus('idle')
    } catch (error) {
      setCoverUploadStatus('error')
      setCoverUploadError(error instanceof Error ? error.message : 'Cover image upload failed.')
    } finally {
      e.target.value = ''
    }
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

      <div>
        <label htmlFor="cover-image">Cover image</label>
        <input
          id="cover-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCoverImageChange}
          disabled={coverUploadStatus === 'uploading'}
        />
        {coverUploadStatus === 'uploading' && <p>Uploading cover image...</p>}
        {coverUploadStatus === 'error' && <p role="alert">{coverUploadError}</p>}
        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element -- cover
          // image lives on the public R2 domain, not a Next-optimizable
          // local/static asset.
          <img src={article.coverImage} alt="Cover preview" style={{ maxWidth: '200px' }} />
        )}
      </div>

      <BlockEditor initialContent={article.blocknoteContent} onChange={handleEditorChange} getArticleId={getArticleId} />
      <button onClick={handlePublish} disabled={publishStatus === 'publishing'}>
        {article.status === 'published' ? 'Update published article' : 'Publish'}
      </button>
      {publishStatus === 'published' && <p>Published.</p>}
      {publishStatus === 'error' && <p>Publish failed.</p>}
    </main>
  )
}
