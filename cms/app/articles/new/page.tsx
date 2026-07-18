'use client'

import { useState, useCallback, useRef, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'

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
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- cover
          // image lives on the public R2 domain, not a Next-optimizable
          // local/static asset.
          <img src={coverImageUrl} alt="Cover preview" style={{ maxWidth: '200px' }} />
        )}
      </div>

      <BlockEditor initialContent="[]" onChange={handleEditorChange} getArticleId={createDraftIfNeeded} />
      {articleId && (
        <button onClick={() => router.push(`/articles/${articleId}`)}>
          Continue editing (SEO fields, cover image, publish)
        </button>
      )}
    </main>
  )
}
