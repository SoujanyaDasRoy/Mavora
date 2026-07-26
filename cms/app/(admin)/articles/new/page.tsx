'use client'

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'

// BlockNote touches `window` during editor initialization, so it can't be
// server-rendered. Load it client-side only to avoid a prerender failure.
const BlockEditor = dynamic(
  () => import('@/components/BlockEditor').then((mod) => mod.BlockEditor),
  { ssr: false }
)

const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const

interface DraftArticle {
  id: string
  title: string
  pillar: (typeof PILLARS)[number]
  blocknoteContent: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  coverImage: string | null
  status: 'draft' | 'published'
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

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState<(typeof PILLARS)[number]>('ai')
  const [articleId, setArticleId] = useState<string | null>(null)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const [draftLabel, setDraftLabel] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverUploadStatus, setCoverUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  const [dragOverCover, setDragOverCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

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
      const article = (await response.json()) as DraftArticle
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

  // Same tick + label logic as the [id] page.
  useEffect(() => {
    if (save.kind !== 'saved') return
    const interval = window.setInterval(() => {
      setDraftLabel(formatRelative(new Date(save.at)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [save])

  async function patchArticle(id: string, patch: Partial<DraftArticle>): Promise<void> {
    setSave({ kind: 'saving' })
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      setSave({ kind: 'idle' })
      return
    }
    setSave({ kind: 'saved', at: Date.now() })
    setDraftLabel(formatRelative(new Date()))
  }

  const handleEditorChange = useCallback(
    async (json: string) => {
      const id = await createDraftIfNeeded()
      await patchArticle(id, { blocknoteContent: json })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [articleId, title, pillar]
  )

  async function handleTitleBlur() {
    if (!title.trim()) return
    const id = await createDraftIfNeeded()
    await patchArticle(id, { title })
  }

  async function handlePillarChange(next: (typeof PILLARS)[number]) {
    if (pillar === next) return
    setPillar(next)
    const id = await createDraftIfNeeded()
    await patchArticle(id, { pillar: next })
  }

  async function uploadCover(file: File) {
    setCoverUploadStatus('uploading')
    setCoverUploadError(null)
    try {
      const id = await createDraftIfNeeded()
      const media = await uploadMediaFile(id, file, `Cover image for ${title || 'Untitled'}`)
      const publicUrl = getPublicMediaUrl(media.r2Key)
      await patchArticle(id, { coverImage: publicUrl })
      setCoverImageUrl(publicUrl)
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
          <PillarPill value={pillar} onChange={handlePillarChange} />
          <SaveBadge save={save} draftLabel={draftLabel} />
        </div>
        {articleId && (
          <Button
            variant="outline"
            onClick={() => router.push(`/articles/${articleId}`)}
            className="text-xs"
          >
            Open full editor →
          </Button>
        )}
      </div>

      {/* Title */}
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

      {/* Cover */}
      <CoverArea
        coverImage={coverImageUrl}
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

      {/* Editor (no rail on new -- SEO/publish live in the full editor) */}
      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 min-h-[480px]"
        gradientSize={200}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.05}
      >
        <BlockEditor
          initialContent="[]"
          onChange={handleEditorChange}
          getArticleId={createDraftIfNeeded}
        />
      </MagicCard>
    </div>
  )
}

// ---------- helpers (kept inline to avoid a second file for a few lines) ----------

const PILLAR_BG: Record<(typeof PILLARS)[number], string> = {
  ai: 'var(--color-pillar-ai)',
  technology: 'var(--color-pillar-tech)',
  productivity: 'var(--color-pillar-prod)',
  business: 'var(--color-pillar-bus)',
}

function PillarPill({
  value,
  onChange,
}: {
  value: (typeof PILLARS)[number]
  onChange: (next: (typeof PILLARS)[number]) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as (typeof PILLARS)[number])}
        className="appearance-none rounded-full pl-3 pr-7 py-1 text-xs font-semibold uppercase tracking-wider text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
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

function SaveBadge({ save, draftLabel }: { save: SaveState; draftLabel: string }) {
  let label = 'Not started'
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