'use client'

import { useEffect, useMemo, useRef } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'

export interface BlockEditorProps {
  initialContent: string
  articleId?: string
  onChange?: (json: string) => void | Promise<void>
  getArticleId?: () => Promise<string>
}

/**
 * Real BlockNote editor (replaces the JSON-textarea stub).
 *
 * Contract preserved for callers (`app/(admin)/articles/{new,[id]}/page.tsx`):
 *  - `initialContent` is still a string (BlockNote JSON serialized)
 *  - `onChange` receives the BlockNote JSON as a string (matches the
 *    PATCH /api/articles/[id] body shape `blocknoteContent`)
 *  - `getArticleId` is resolved once on mount so the lazy-draft-creation
 *    machinery on the new-article page still gets its chance to fire before
 *    the editor's autosave starts.
 *
 * BlockNote blocks covered by the stock schema: paragraph, heading,
 * bullet/numbered list, check list, quote, code block, table, image, video,
 * audio, file, divider. The legacy YouTube/Twitter embed blocks from
 * `lib/mdx-convert.ts` aren't reproduced here for now -- paste the URL into
 * a video block instead (TODO: add custom embed blocks once the converter
 * is updated).
 */
export function BlockEditor({
  initialContent,
  articleId,
  onChange,
  getArticleId,
}: BlockEditorProps) {
  // Parse the incoming JSON-string into PartialBlock[] for BlockNote. The
  // current pages always pass `[]` or a previously-serialized document; if
  // the string is malformed (legacy content, user edited it directly), fall
  // back to a single empty paragraph rather than throwing -- the autosave
  // will still write a valid document on the first onChange.
  const parsedInitialContent = useMemo(() => {
    if (initialContent === undefined || initialContent === null || initialContent === '') {
      return undefined
    }
    try {
      const parsed = JSON.parse(initialContent)
      if (Array.isArray(parsed)) return parsed
      return undefined
    } catch {
      return undefined
    }
  }, [initialContent])

  const editor = useCreateBlockNote({
    initialContent: parsedInitialContent,
    // Wire BlockNote's image/file upload to our existing /api/media/upload.
    // The function is invoked with the BlockNote-managed `blockId` so we
    // can skip the createDraftIfNeeded race entirely when the page already
    // has an articleId from `articleId` or `getArticleId()`.
    uploadFile: async (file: File, blockId?: string) => {
      const id = articleId ?? (getArticleId ? await getArticleId() : undefined)
      if (!id) throw new Error('Article id unavailable for upload')
      const media = await uploadMediaFile(id, file, file.name)
      return getPublicMediaUrl(media.r2Key)
    },
  })

  // Resolve the article id once on mount so the lazy-creation ref on the
  // new-article page gets triggered the moment this component renders,
  // instead of racing against the first onChange call.
  const resolvedRef = useRef(false)
  useEffect(() => {
    if (resolvedRef.current || !getArticleId) return
    resolvedRef.current = true
    void getArticleId()
  }, [getArticleId])

  // Bridge: editor.document -> JSON string to keep the existing PATCH contract.
  function handleChange() {
    try {
      const json = JSON.stringify(editor.document)
      void onChange?.(json)
    } catch {
      // editor.document is always serializable in stock BlockNote; ignore
      // any catastrophic failure rather than throwing during render.
    }
  }

  return (
    <div className="bn-container">
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
    </div>
  )
}