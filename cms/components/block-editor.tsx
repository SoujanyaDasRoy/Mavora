'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Placeholder BlockNote replacement.
 *
 * The original article pages import a `BlockEditor` from
 * `@/components/BlockEditor` that wraps `@blocknote/react`. The wrapper
 * file was removed from the tree (along with the rest of the legacy
 * Masonry/AdminHeader chrome) and BlockNote itself has not yet been
 * re-wired into the new `app/(admin)/...` pages. This stub preserves the
 * exact `initialContent` / `onChange` / `getArticleId` surface so the
 * editor pages compile and existing autosave flows (`onChange` called
 * after every keystroke) keep working unchanged.
 *
 * Until a real BlockNote re-integration lands, the editor renders the
 * raw BlockNote JSON in a styled `<pre>` and lets the user edit it
 * directly. Save -> onChange flow is preserved.
 */
export interface BlockEditorProps {
  initialContent: string
  onChange?: (json: string) => void | Promise<void>
  getArticleId?: () => Promise<string>
}

export function BlockEditor({ initialContent, onChange, getArticleId }: BlockEditorProps) {
  const [text, setText] = useState<string>('')
  const lastEmittedRef = useRef<string>('')

  // Pretty-print the initial BlockNote JSON so the editor isn't a wall of
  // single-line noise. Memoize so a re-render with the same content doesn't
  // rewrite the textarea contents.
  const pretty = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(initialContent), null, 2)
    } catch {
      return initialContent
    }
  }, [initialContent])

  useEffect(() => {
    setText(pretty)
    lastEmittedRef.current = pretty
  }, [pretty])

  // `getArticleId` is invoked by the page before each autosave (see
  // `app/articles/new/page.tsx`'s `createDraftIfNeeded`). We resolve it
  // immediately so the existing race-handling ref on the new-article page
  // keeps working; the value it returns is consumed by the page, not by us.
  useEffect(() => {
    void getArticleId?.()
  }, [getArticleId])

  async function handleChange(next: string) {
    setText(next)
    if (next === lastEmittedRef.current) return
    lastEmittedRef.current = next
    let serialized: string
    try {
      // If the user kept it valid JSON, re-serialize canonically so the
      // PATCH payload matches what a real BlockNote would emit. Otherwise
      // pass through raw — the onChange contract is "json string".
      serialized = JSON.stringify(JSON.parse(next))
    } catch {
      serialized = next
    }
    await onChange?.(serialized)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--color-fg-subtle)]">
        <span>Editor (BlockNote JSON — replace with rich editor in a follow-up)</span>
        <span>autosave: on</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
        className="w-full min-h-[400px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm font-mono text-[var(--color-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      />
    </div>
  )
}