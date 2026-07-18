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
  const onChangeRef = useRef<BlockEditorProps['onChange'] | undefined>(undefined)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

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
