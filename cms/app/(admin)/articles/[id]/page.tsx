'use client'

import { useEffect, useState, useCallback, type ChangeEvent } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MagicCard } from '@/components/ui/magic-card'
import { ShinyButton } from '@/components/ui/shiny-button'
import { cn } from '@/lib/utils'

// BlockNote touches `window` during editor initialization, so it can't be
// server-rendered. Load it client-side only to avoid a prerender failure.
// The current `BlockEditor` import resolves to a JSON-textarea stub (see
// `components/BlockEditor.tsx`) pending full BlockNote re-integration.
const BlockEditor = dynamic(
  () => import('@/components/BlockEditor').then((mod) => mod.BlockEditor),
  { ssr: false }
)

interface ArticleData {
  id: string
  title: string
  blocknoteContent: string
  seoTitle: string | null
  seoDescription: string | null
  coverImage: string | null
  status: 'draft' | 'published'
}

type Tab = 'content' | 'seo' | 'publish'

const SEO_DESC_MAX = 160

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle')
  const [coverUploadStatus, setCoverUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('content')

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
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-12 text-center">
        <p className="text-[var(--color-fg-muted)]">Loading article...</p>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'seo', label: 'SEO' },
    { id: 'publish', label: 'Publish' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="text-3xl font-bold truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {article.title}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-transparent"
              style={{
                backgroundColor:
                  article.status === 'published'
                    ? 'color-mix(in srgb, var(--color-positive) 20%, transparent)'
                    : 'color-mix(in srgb, var(--color-fg-subtle) 18%, transparent)',
                color:
                  article.status === 'published' ? 'var(--color-positive)' : 'var(--color-fg-muted)',
              }}
            >
              {article.status}
            </Badge>
            {publishStatus === 'published' && (
              <span className="text-xs text-[var(--color-positive)] font-semibold">
                Live · Git deploy triggered
              </span>
            )}
            {publishStatus === 'error' && (
              <span className="text-xs text-[var(--color-accent)] font-semibold">
                Publish failed — check GITHUB_CONTENT_TOKEN permissions.
              </span>
            )}
          </div>
        </div>
        <ShinyButton
          onClick={handlePublish}
          aria-disabled={publishStatus === 'publishing'}
          className={cn(
            'text-white',
            publishStatus === 'publishing' && 'opacity-50 pointer-events-none'
          )}
          style={{ background: 'var(--color-accent)' }}
        >
          {publishStatus === 'publishing'
            ? 'Publishing...'
            : article.status === 'published'
              ? 'Update Live Article'
              : 'Publish Article'}
        </ShinyButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
              tab === t.id
                ? 'border-[var(--color-accent)] text-[var(--color-fg)]'
                : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content tab */}
      {tab === 'content' && (
        <MagicCard
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 min-h-[400px]"
          gradientSize={200}
          gradientFrom="var(--color-accent)"
          gradientTo="var(--color-accent-hover)"
          gradientOpacity={0.05}
        >
          <BlockEditor
            initialContent={article.blocknoteContent}
            onChange={handleEditorChange}
            getArticleId={getArticleId}
          />
        </MagicCard>
      )}

      {/* SEO tab */}
      {tab === 'seo' && (
        <MagicCard
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 space-y-5"
          gradientSize={200}
          gradientFrom="var(--color-accent)"
          gradientTo="var(--color-accent-hover)"
          gradientOpacity={0.05}
        >
          <div>
            <label htmlFor="seo-title" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
              SEO Title
            </label>
            <Input
              id="seo-title"
              placeholder="Custom SEO title (defaults to article title)"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              onBlur={saveSeoFields}
            />
          </div>
          <div>
            <label
              htmlFor="seo-description"
              className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2"
            >
              SEO Description
            </label>
            <textarea
              id="seo-description"
              placeholder="Brief summary for search engines..."
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              onBlur={saveSeoFields}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <p
              className={cn(
                'mt-1 text-xs',
                seoDescription.length > SEO_DESC_MAX
                  ? 'text-[var(--color-negative)]'
                  : 'text-[var(--color-fg-subtle)]'
              )}
            >
              {seoDescription.length} / {SEO_DESC_MAX} characters
            </p>
          </div>
        </MagicCard>
      )}

      {/* Publish tab */}
      {tab === 'publish' && (
        <MagicCard
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 space-y-5"
          gradientSize={200}
          gradientFrom="var(--color-accent)"
          gradientTo="var(--color-accent-hover)"
          gradientOpacity={0.05}
        >
          <div>
            <label
              htmlFor="cover-image"
              className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2"
            >
              Cover Image
            </label>
            <Input
              id="cover-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverImageChange}
              disabled={coverUploadStatus === 'uploading'}
            />
            {coverUploadStatus === 'uploading' && (
              <p className="mt-2 text-sm text-[var(--color-fg-muted)]">Uploading cover image...</p>
            )}
            {coverUploadStatus === 'error' && (
              <p role="alert" className="mt-2 text-sm text-[var(--color-accent)]">
                {coverUploadError}
              </p>
            )}
            {article.coverImage && (
              <div className="mt-3 inline-block border border-[var(--color-border)] rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.coverImage} alt="Cover preview" className="block max-w-[300px]" />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] pt-5">
            <p className="text-sm text-[var(--color-fg-muted)]">
              Publishing pushes this article to the live site via a Git workflow. Use the button below when you're ready.
            </p>
            <ShinyButton
              onClick={handlePublish}
              aria-disabled={publishStatus === 'publishing'}
              className={cn(
                'text-white mt-4',
                publishStatus === 'publishing' && 'opacity-50 pointer-events-none'
              )}
              style={{ background: 'var(--color-accent)' }}
            >
              {publishStatus === 'publishing'
                ? 'Publishing...'
                : article.status === 'published'
                  ? 'Update Live Article'
                  : 'Publish Article'}
            </ShinyButton>
          </div>
        </MagicCard>
      )}
    </div>
  )
}