'use client'

import { useEffect, useState, useCallback, type ChangeEvent } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'
import { AdminHeader } from '@/components/AdminHeader'

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

  if (!article) {
    return (
      <div className="admin-layout">
        <AdminHeader />
        <main className="admin-content">
          <div className="state-container">
            <div className="state-title">Loading Article...</div>
            <div className="state-desc">Fetching content from D1 database...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <AdminHeader />
      <main className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>{article.title}</h1>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span className={`badge badge-${article.status}`}>
              {article.status}
            </span>
            <button
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={publishStatus === 'publishing'}
            >
              {publishStatus === 'publishing' ? 'Publishing...' : article.status === 'published' ? 'Update Live Article' : 'Publish Article'}
            </button>
          </div>
        </div>

        {publishStatus === 'published' && (
          <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Article published successfully! Git deploy triggered.
          </p>
        )}
        {publishStatus === 'error' && (
          <p style={{ color: 'var(--color-accent)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Publishing failed. Please check GITHUB_CONTENT_TOKEN permissions.
          </p>
        )}

        <div className="form-section">
          <h2>SEO & Settings</h2>

          <div className="form-group">
            <label htmlFor="seo-title">SEO Title</label>
            <input
              id="seo-title"
              className="form-control"
              placeholder="Custom SEO Title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              onBlur={saveSeoFields}
            />
          </div>

          <div className="form-group">
            <label htmlFor="seo-description">SEO Description</label>
            <textarea
              id="seo-description"
              className="form-control"
              placeholder="Brief summary for search engines..."
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              onBlur={saveSeoFields}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cover-image">Cover Image</label>
            <input
              id="cover-image"
              type="file"
              className="form-control"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverImageChange}
              disabled={coverUploadStatus === 'uploading'}
            />
            {coverUploadStatus === 'uploading' && <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Uploading cover image...</p>}
            {coverUploadStatus === 'error' && <p role="alert" style={{ color: 'var(--color-accent)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{coverUploadError}</p>}
            {article.coverImage && (
              <div style={{ marginTop: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.coverImage} alt="Cover preview" style={{ maxWidth: '200px', display: 'block' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1.2rem' }}>
          <h2>Content Editor</h2>
        </div>

        <div style={{ minHeight: '400px', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
          <BlockEditor initialContent={article.blocknoteContent} onChange={handleEditorChange} getArticleId={getArticleId} />
        </div>
      </main>
    </div>
  )
}
