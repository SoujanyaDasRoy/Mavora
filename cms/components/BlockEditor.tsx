'use client'

import '@blocknote/core/fonts/inter.css'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { useEffect, useRef } from 'react'

interface BlockEditorProps {
  initialContent: string
  onChange: (json: string) => void
}

export function BlockEditor({ initialContent, onChange }: BlockEditorProps) {
  const parsed = initialContent && initialContent !== '[]' ? JSON.parse(initialContent) : undefined
  const editor = useCreateBlockNote({ initialContent: parsed })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(JSON.stringify(editor.document))
      }, 2000)
    })
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      unsubscribe()
    }
  }, [editor, onChange])

  return <BlockNoteView editor={editor} />
}
