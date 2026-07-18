'use client'

import '@blocknote/core/fonts/inter.css'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { useEffect, useRef } from 'react'
import { uploadMediaFile, getPublicMediaUrl } from '@/lib/media-client'

interface BlockEditorProps {
  initialContent: string
  onChange: (json: string) => void
  // Resolves the id of the article inline image uploads should attach to,
  // creating it first if it doesn't exist yet. On the Edit Article page this
  // just returns the existing id; on the New Article page it's the same
  // `createDraftIfNeeded()` used for the title/body lazy-draft-creation
  // autosave, so inserting an image is what triggers the draft to exist,
  // exactly like typing a title or body already does.
  getArticleId: () => Promise<string>
}

export function BlockEditor({ initialContent, onChange, getArticleId }: BlockEditorProps) {
  const parsed = initialContent && initialContent !== '[]' ? JSON.parse(initialContent) : undefined
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onChangeRef = useRef<BlockEditorProps['onChange'] | undefined>(undefined)
  // useCreateBlockNote memoizes the editor once (useMemo with an empty deps
  // array -- see node_modules/@blocknote/react/src/hooks/useCreateBlockNote.tsx)
  // and never recreates it, so the `uploadFile` closure below is only ever
  // built from the FIRST render's `getArticleId`. Route later renders'
  // (possibly newer) `getArticleId` through a ref instead of capturing it
  // directly, the same way `onChangeRef` already routes around the same
  // memoization for `onChange` just below.
  const getArticleIdRef = useRef(getArticleId)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    getArticleIdRef.current = getArticleId
  }, [getArticleId])

  const editor = useCreateBlockNote({
    initialContent: parsed,
    uploadFile: async (file: File) => {
      // BlockNote doesn't currently offer a way to prompt the writer for alt
      // text inline during upload -- falling back to the file name (also
      // what blockNoteToMdx uses as this image block's alt text, see
      // lib/mdx-convert.ts) is better than empty, but a dedicated "edit alt
      // text" affordance would be a real accessibility improvement here;
      // noted as a follow-up rather than blocking this fix on it.
      const articleId = await getArticleIdRef.current()
      const media = await uploadMediaFile(articleId, file, file.name)
      return getPublicMediaUrl(media.r2Key)
    },
  })

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChangeRef.current?.(JSON.stringify(editor.document))
      }, 2000)
    })
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        onChangeRef.current?.(JSON.stringify(editor.document))
        debounceRef.current = undefined
      }
      unsubscribe()
    }
  }, [editor])

  return <BlockNoteView editor={editor} />
}
