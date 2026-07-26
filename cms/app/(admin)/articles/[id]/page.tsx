'use client'

import { useEffect, useState, useCallback, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
const BlockEditor = dynamic(
  () => import('@/components/BlockEditor').then((mod) => mod.BlockEditor),
  { ssr: false }
)

const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const

const SEO_DESC_MAX = 160
const SAVED_LABEL_RESET_MS = 2200

interface ArticleData {
  id: string
  title: string
  slug: string
  pillar: (typeof PILLARS)[number]
  blocknoteContent: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  coverImage: string | null
  status: 'draft' | 'published'
  publishedAt: string | null
  updatedAt: string
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: number }

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  return `${hr}h ago`
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EditArticlePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState<(typeof PILLARS)[number]>('ai')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle')
  const [coverUploadStatus, setCoverUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const [draftLabel, setDraftLabel] = useState<string>('')
  const [dragOverCover, setDragOverCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const getArticleId = useCallback(async () => id, [id])

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json as ArticleData
        setArticle(data)
        setTitle(data.title)
        setPillar(data.pillar)
        setSeoTitle(data.seoTitle ?? '')
        setSeoDescription(data.seoDescription ?? '')
        setSeoKeywords(data.seoKeywords ?? '')
      })
  }, [id])

  // Tick the "Saved Ns ago" label without flooding re-renders.
  useEffect(() => {
    if (save.kind !== 'saved') return
    const interval = window.setInterval(() => {
      setDraftLabel(formatRelative(new Date(save.at)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [save])

  // Auto-clear "Saved Ns ago" after a few seconds so the badge doesn't sit
  // there forever -- mirrors Substack / Notion.
  useEffect(() => {
    if (save.kind !== 'saved') return
    const t = window.setTimeout(() => {
      setDraftLabel('')
    }, SAVED_LABEL_RESET_MS * 6)
    return () => window.clearTimeout(t)
  }, [save])

  async function patchArticle(patch: Partial<ArticleData>): Promise<ArticleData | null> {
    setSave({ kind: 'saving' })
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      setSave({ kind: 'idle' })
      return null
    }
    const data = (await res.json()) as ArticleData
    setArticle(data)
    setSave({ kind: 'saved', at: Date.now() })
    setDraftLabel(formatRelative(new Date()))
    return data
  }

  const handleEditorChange = useCallback(
    async (json: string) => {
      await patchArticle({ blocknoteContent: json })
    },
    // `patchArticle` is stable enough -- it's recreated every render but
    // only the captured id matters for this autosave path. Keep the deps
    // honest so ESLint doesn't whine when we re-enable react-hooks rules.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )

  async function handleTitleBlur() {
    if (!article || article.title === title) return
    await patchArticle({ title })
  }

  async function handlePillarChange(next: (typeof PILLARS)[number]) {
    if (!article || article.pillar === next) return
    setPillar(next)
    await patchArticle({ pillar: next })
  }

  async function saveSeoFields() {
    await patchArticle({
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
    })
  }

  async function handlePublish() {
    setPublishStatus('publishing')
    await saveSeoFields()
    const response = await fetch(`/api/articles/${id}/publish`, { method: 'POST' })
    setPublishStatus(response.ok ? 'published' : 'error')
    if (response.ok && article) {
      setArticle({ ...article, status: 'published' })
    }
  }

  async function uploadCover(file: File) {
    setCoverUploadStatus('uploading')
    setCoverUploadError(null)
    try {
      const media = await uploadMediaFile(id, file, `Cover image for ${title || 'Untitled'}`)
      const publicUrl = getPublicMediaUrl(media.r2Key)
      await patchArticle({ coverImage: publicUrl })
      setCoverUploadStatus('idle')
    } catch (error) {
      setCoverUploadStatus('error')
      setCoverUploadError(error instanceof Error ? error.message : 'Cover image upload failed.')
    }
  }

  async function handleCoverImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadCover(file)
    e.target.value = ''
  }

  async function handleCoverDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOverCover(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    await uploadCover(file)
  }

  if (!article) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-12 text-center">
        <p className="text-[var(--color-fg-muted)]">Loading article...</p>
      </div>
    )
  }

  const seoDescValid = seoDescription.length <= SEO_DESC_MAX

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => router.push('/articles')}
            className="text-[var(--color-fg-muted)]"
          >
            ← Articles
          </Button>
          <span aria-hidden className="text-[var(--color-fg-subtle)]">·</span>
          <PillarPill value={pillar} onChange={handlePillarChange} disabled={article.status === 'published'} />
          <StatusPill status={article.status} publishedAt={article.publishedAt} />
          <SaveBadge save={save} draftLabel={draftLabel} />
        </div>
      </div>

      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          aria-label="Article title"
          className="w-full bg-transparent border-0 outline-none text-4xl md:text-5xl font-bold placeholder:text-[var(--color-fg-subtle)] focus:outline-none"
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>

      {/* Cover image */}
      <CoverArea
        coverImage={article.coverImage}
        dragOver={dragOverCover}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOverCover(true)
        }}
        onDragLeave={() => setDragOverCover(false)}
        onDrop={handleCoverDrop}
        onClick={() => coverInputRef.current?.click()}
        uploading={coverUploadStatus === 'uploading'}
        error={coverUploadError}
      />
      <input
        ref={coverInputRef}
        id="cover-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleCoverImageChange}
        className="hidden"
        disabled={coverUploadStatus === 'uploading'}
      />

      {/* Editor + rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <MagicCard
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 min-h-[480px]"
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

        {/* Right rail */}
        <aside className="lg:sticky lg:top-6 space-y-4">
          {/* SEO */}
          <MagicCard
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 space-y-4"
            gradientSize={180}
            gradientFrom="var(--color-accent)"
            gradientTo="var(--color-accent-hover)"
            gradientOpacity={0.06}
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-fg-subtle)]">SEO</p>
              <p className="mt-1 text-sm font-semibold">Search &amp; social</p>
            </div>

            <div>
              <label htmlFor="seo-title" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
                SEO title
              </label>
              <Input
                id="seo-title"
                placeholder={title || 'Defaults to article title'}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                onBlur={saveSeoFields}
              />
            </div>

            <div>
              <label htmlFor="seo-description" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
                Description
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
                  seoDescValid ? 'text-[var(--color-fg-subtle)]' : 'text-[var(--color-negative)]'
                )}
              >
                {seoDescription.length} / {SEO_DESC_MAX}
              </p>
            </div>

            <div>
              <label htmlFor="seo-keywords" className="block text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
                Keywords
              </label>
              <Input
                id="seo-keywords"
                placeholder="comma, separated, tags"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                onBlur={saveSeoFields}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Emitted as <code className="text-[var(--color-fg)]">tags: [...]</code> in frontmatter.
              </p>
            </div>
          </MagicCard>

          {/* Publish */}
          <MagicCard
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 space-y-4"
            gradientSize={180}
            gradientFrom="var(--color-accent)"
            gradientTo="var(--color-accent-hover)"
            gradientOpacity={0.06}
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-fg-subtle)]">Publish</p>
              <p className="mt-1 text-sm font-semibold">Push to live</p>
            </div>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Publishing writes MDX to Git, triggering a redeploy of the public site. Requires a description.
            </p>
            <ShinyButton
              onClick={handlePublish}
              aria-disabled={publishStatus === 'publishing'}
              className={cn(
                'text-white w-full',
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
            {publishStatus === 'published' && (
              <p className="text-xs text-[var(--color-positive)] font-semibold">
                Live · Git deploy triggered
              </p>
            )}
            {publishStatus === 'error' && (
              <p className="text-xs text-[var(--color-accent)] font-semibold">
                Publish failed — check GITHUB_CONTENT_TOKEN permissions.
              </p>
            )}
            {article.status === 'published' && article.publishedAt && (
              <p className="text-xs text-[var(--color-fg-subtle)]">
                First published {formatDate(article.publishedAt)}.
              </p>
            )}
          </MagicCard>
        </aside>
      </div>
    </div>
  )
}

// ---------- helpers ----------

const PILLAR_BG: Record<(typeof PILLARS)[number], string> = {
  ai: 'var(--color-pillar-ai)',
  technology: 'var(--color-pillar-tech)',
  productivity: 'var(--color-pillar-prod)',
  business: 'var(--color-pillar-bus)',
}

function PillarPill({
  value,
  onChange,
  disabled,
}: {
  value: (typeof PILLARS)[number]
  onChange: (next: (typeof PILLARS)[number]) => void
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as (typeof PILLARS)[number])}
        disabled={disabled}
        className="appearance-none rounded-full pl-3 pr-7 py-1 text-xs font-semibold uppercase tracking-wider text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
        style={{ backgroundColor: PILLAR_BG[value] }}
        aria-label="Article pillar"
      >
        {PILLARS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <span aria-hidden className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs pointer-events-none">
        ▾
      </span>
    </div>
  )
}

function StatusPill({
  status,
  publishedAt,
}: {
  status: 'draft' | 'published'
  publishedAt: string | null
}) {
  const isPub = status === 'published'
  return (
    <Badge
      variant="outline"
      className="border-transparent"
      style={{
        backgroundColor: isPub
          ? 'color-mix(in srgb, var(--color-positive) 20%, transparent)'
          : 'color-mix(in srgb, var(--color-fg-subtle) 18%, transparent)',
        color: isPub ? 'var(--color-positive)' : 'var(--color-fg-muted)',
      }}
    >
      {isPub ? `Published${publishedAt ? ` · ${formatDate(publishedAt)}` : ''}` : 'Draft'}
    </Badge>
  )
}

function SaveBadge({ save, draftLabel }: { save: SaveState; draftLabel: string }) {
  let label = 'Draft'
  let color = 'var(--color-fg-muted)'
  if (save.kind === 'saving') {
    label = 'Saving…'
    color = 'var(--color-fg-muted)'
  } else if (save.kind === 'saved') {
    label = draftLabel || 'Saved'
    color = 'var(--color-positive)'
  }
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {label}
    </span>
  )
}

function CoverArea({
  coverImage,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  uploading,
  error,
}: {
  coverImage: string | null
  dragOver: boolean
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent<HTMLDivElement>) => Promise<void>
  onClick: () => void
  uploading: boolean
  error: string | null
}) {
  if (coverImage) {
    return (
      <div
        className="relative group rounded-xl overflow-hidden border border-[var(--color-border)] cursor-pointer"
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm text-white font-medium">
          {uploading ? 'Uploading…' : 'Click or drop to replace'}
        </div>
      </div>
    )
  }
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'rounded-xl border-2 border-dashed cursor-pointer transition-colors p-8 text-center',
        dragOver
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
      )}
    >
      <p className="text-sm font-medium text-[var(--color-fg)]">
        {uploading ? 'Uploading…' : dragOver ? 'Drop to upload' : 'Click or drop a cover image'}
      </p>
      <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
        JPG, PNG, or WebP. 1200×630 recommended.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-[var(--color-accent)]">
          {error}
        </p>
      )}
    </div>
  )
}