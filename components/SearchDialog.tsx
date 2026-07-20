'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import type { SearchEntry } from '@/lib/search-index'
import { PILLAR_LABELS } from '@/lib/pillars'
import { cn } from '@/lib/utils'

type Status = 'loading' | 'ready' | 'error'

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

// Command-palette style search — the pattern most reference sites (Stripe,
// Linear, Vercel docs) actually use: a centered modal opened with Ctrl/Cmd+K
// or a click, arrow-key navigable, instead of a bar that pushes the header
// taller. Built on the same @base-ui/react/dialog primitive as the mobile
// Sheet, so no new dependency.
export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open || index.length > 0 || status === 'error') return
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
  }, [open, index.length, status])

  const results = query.trim()
    ? index.filter((entry) => `${entry.title} ${entry.description}`.toLowerCase().includes(query.toLowerCase()))
    : index

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function go(entry: SearchEntry) {
    setOpen(false)
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
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Search articles"
        className="inline-flex items-center justify-center size-9 rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <SearchIcon />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          initialFocus={inputRef}
          className="fixed z-50 left-1/2 top-[14vh] -translate-x-1/2 w-[92vw] max-w-[560px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl transition duration-150 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95"
        >
          <Dialog.Title className="sr-only">Search articles</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search Mavora articles by title or description.
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3.5">
            <SearchIcon className="text-[var(--color-fg-subtle)] shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search articles..."
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[var(--color-fg-subtle)]"
            />
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold text-[var(--color-fg-subtle)] border border-[var(--color-border-strong)] rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2">
            {status === 'loading' && (
              <p className="text-[var(--color-fg-muted)] text-sm px-3 py-6 text-center">Loading…</p>
            )}
            {status === 'error' && (
              <p className="text-[var(--color-fg-muted)] text-sm px-3 py-6 text-center">
                Search is temporarily unavailable — please try again later.
              </p>
            )}
            {status === 'ready' && results.length === 0 && (
              <p className="text-[var(--color-fg-muted)] text-sm px-3 py-6 text-center">
                No results for &quot;{query}&quot;.
              </p>
            )}
            {status === 'ready' &&
              results.map((entry, i) => (
                <button
                  key={`${entry.pillar}-${entry.slug}`}
                  onClick={() => go(entry)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'w-full text-left flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors',
                    i === activeIndex ? 'bg-[var(--color-bg-secondary)]' : ''
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-fg-subtle)]">
                      {PILLAR_LABELS[entry.pillar as keyof typeof PILLAR_LABELS] ?? entry.pillar}
                    </span>
                  </span>
                  <span className="font-display font-semibold text-sm leading-snug">{entry.title}</span>
                  <span className="text-xs text-[var(--color-fg-muted)] line-clamp-1">{entry.description}</span>
                </button>
              ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
