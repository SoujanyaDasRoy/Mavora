'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchEntry } from '@/lib/search-index'
import { PILLAR_LABELS } from '@/lib/pillars'
import { cn } from '@/lib/utils'
import { Dialog } from '@base-ui/react/dialog'
import { Search, CornerDownLeft, ArrowUp, ArrowDown, X } from 'lucide-react'

type Status = 'loading' | 'ready' | 'error'

export interface SearchBoxProps {
  isOpen?: boolean
  onClose?: () => void
  inline?: boolean
}

export function SearchBox({ isOpen, onClose, inline = isOpen === undefined }: SearchBoxProps) {
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Only load search index if modal is open, or we're in inline mode
    if (!inline && !isOpen) return

    const controller = new AbortController()

    fetch('/search-index.json', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setIndex(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('error')
      })

    return () => controller.abort()
  }, [inline, isOpen])

  const results = query.trim()
    ? index.filter((entry) => {
        const haystack = `${entry.title} ${entry.description}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : index

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function go(entry: SearchEntry) {
    onClose?.()
    setQuery('')
    router.push(`/${entry.pillar}/${entry.slug}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      go(results[activeIndex])
    } else if (e.key === 'Escape' && !inline) {
      e.preventDefault()
      onClose?.()
    }
  }

  const content = (
    <div className={cn(
      "w-full flex flex-col overflow-hidden",
      inline 
        ? "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl shadow-lg" 
        : ""
    )}>
      {/* Search Input block */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
        <Search className="text-[var(--color-fg-subtle)] shrink-0 size-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search articles, topics..."
          className="flex-1 bg-transparent outline-none text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] p-1 rounded-md transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Results Box */}
      <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
        {status === 'loading' && (
          <p className="text-[var(--color-fg-muted)] text-sm px-3 py-8 text-center flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--color-accent)] border-t-transparent" />
            Loading index…
          </p>
        )}
        {status === 'error' && (
          <p className="text-[var(--color-fg-muted)] text-sm px-3 py-8 text-center">
            Search is temporarily unavailable — please try again later.
          </p>
        )}
        {status === 'ready' && results.length === 0 && (
          <p className="text-[var(--color-fg-muted)] text-sm px-3 py-8 text-center">
            No results found for &quot;{query}&quot;.
          </p>
        )}
        {status === 'ready' &&
          results.map((entry, i) => {
            const isActive = i === activeIndex
            return (
              <button
                key={`${entry.pillar}-${entry.slug}`}
                onClick={() => go(entry)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'w-full text-left flex items-start gap-3.5 rounded-xl px-4 py-3 transition-all duration-150 outline-none',
                  isActive
                    ? 'bg-[var(--color-bg-secondary)] shadow-sm translate-x-1 border-l-2 border-[var(--color-accent)] pl-3.5'
                    : 'hover:bg-[var(--color-bg-secondary)]/40 border-l-2 border-transparent'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                      entry.pillar === 'ai' && "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/30",
                      entry.pillar === 'technology' && "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-900/30",
                      entry.pillar === 'productivity' && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-900/30",
                      entry.pillar === 'business' && "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30"
                    )}>
                      {PILLAR_LABELS[entry.pillar as keyof typeof PILLAR_LABELS] ?? entry.pillar}
                    </span>
                  </div>
                  <span className="font-display font-semibold text-sm leading-snug text-[var(--color-fg)] block font-medium">
                    {entry.title}
                  </span>
                  <span className="text-xs text-[var(--color-fg-muted)] line-clamp-1 mt-1 block">
                    {entry.description}
                  </span>
                </div>
                {isActive && (
                  <CornerDownLeft className="size-4 text-[var(--color-fg-subtle)] shrink-0 self-center opacity-70" />
                )}
              </button>
            )
          })}
      </div>

      {/* Footer helper keys */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2.5 bg-[var(--color-bg-secondary)]/50 text-[10px] text-[var(--color-fg-subtle)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ArrowUp className="size-3" />
            <ArrowDown className="size-3" />
            <span>to navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="size-3" />
            <span>to select</span>
          </span>
        </div>
        {!inline && (
          <span className="flex items-center gap-1">
            <span>esc to close</span>
          </span>
        )}
      </div>
    </div>
  )

  if (inline) {
    return content
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose?.() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          initialFocus={inputRef}
          className="fixed z-50 left-1/2 top-[14vh] -translate-x-1/2 w-[92vw] max-w-[560px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-xl shadow-2xl transition duration-150 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95 focus:outline-none flex flex-col overflow-hidden"
        >
          <Dialog.Title className="sr-only">Search articles</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search Mavora articles by title or description.
          </Dialog.Description>
          {content}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
