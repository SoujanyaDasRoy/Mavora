'use client'

import { useState, useCallback, useRef, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicCard } from '@/components/ui/magic-card'

// BlockNote touches `window` during editor initialization, so it can't be
// server-rendered. Load it client-side only to avoid a prerender failure.
// The current `BlockEditor` import resolves to a JSON-textarea stub (see
// `components/BlockEditor.tsx`) pending full BlockNote re-integration.
const BlockEditor = dynamic(
  () => import('@/components/BlockEditor').then((mod) => mod.BlockEditor),
  { ssr: false }
)

const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState<(typeof PILLARS)[number]>('ai')
  const [articleId, setArticleId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverUploadStatus, setCoverUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  // createDraftIfNeeded reads `articleId`/`title`/`pillar` state directly
  // rather than through args, so a plain ref (not useState) is enough to let
  // concurrent callers (title's onBlur, the editor's autosave, and a cover
  // image upload all racing to create the draft) await the SAME in-flight
  // request instead of each firing their own POST /api/articles.
  const draftCreationRef = useRef<Promise<string> | null>(null)

  async function createDraftIfNeeded(): Promise<string> {
    if (articleId) return articleId
    if (draftCreationRef.current) return draftCreationRef.current
    const promise = (async () => {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Untitled', pillar }),
      })
      const article = (await response.json()) as { id: string }
      setArticleId(article.id)
      return article.id
    })()
    draftCreationRef.current = promise
    try {
      return await promise
    } finally {
      draftCreationRef.current = null
    }
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

  async function handleCoverImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploadStatus('uploading')
    setCoverUploadError(null)
    try {
      // A draft has to exist before an upload can be attached to it -- same
      // lazy-creation the title field's onBlur and the editor's autosave
      // already trigger.
      const id = await createDraftIfNeeded()
      const media = await uploadMediaFile(id, file, `Cover image for ${title || 'Untitled'}`)
      const publicUrl = getPublicMediaUrl(media.r2Key)
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImage: publicUrl }),
      })
      setCoverImageUrl(publicUrl)
      setCoverUploadStatus('idle')
    } catch (error) {
      setCoverUploadStatus('error')
      setCoverUploadError(error instanceof Error ? error.message : 'Cover image upload failed.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          New Article
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          A draft is created automatically the first time you move focus out of the title or start writing.
        </p>
      </div>

      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 space-y-5"
        gradientSize={200}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.06}
      >
        <div>
          <label htmlFor="article-title" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
            Article Title
          </label>
          <Input
            id="article-title"
            placeholder="Enter a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={createDraftIfNeeded}
          />
        </div>

        <div>
          <label htmlFor="article-pillar" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
            Pillar
          </label>
          <select
            id="article-pillar"
            value={pillar}
            onChange={(e) => setPillar(e.target.value as (typeof PILLARS)[number])}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            {PILLARS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cover-image" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
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
          {coverImageUrl && (
            <div className="mt-3 inline-block border border-[var(--color-border)] rounded-md overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImageUrl} alt="Cover preview" className="block max-w-[200px]" />
            </div>
          )}
        </div>
      </MagicCard>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Content Editor
        </h2>
        <span className="text-xs font-semibold text-[var(--color-fg-muted)]">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Draft'}
        </span>
      </div>

      <MagicCard className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 min-h-[300px]">
        <BlockEditor initialContent="[]" onChange={handleEditorChange} getArticleId={createDraftIfNeeded} />
      </MagicCard>

      {articleId && (
        <Button onClick={() => router.push(`/articles/${articleId}`)} style={{ backgroundColor: 'var(--color-accent)' }}>
          Continue Editing (SEO, Publish Settings) →
        </Button>
      )}
    </div>
  )
}