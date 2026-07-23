'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchEntry } from '@/lib/search-index'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'

export interface SearchBoxProps {
  isOpen?: boolean
  onClose?: () => void
  inline?: boolean
  query?: string
  status?: 'loading' | 'ready' | 'error'
  results?: SearchEntry[]
  index?: SearchEntry[]
  activeIndex?: number
  setActiveIndex?: (index: number) => void
  onSelect?: (entry: SearchEntry) => void
}

export function SearchBox({
  isOpen,
  onClose,
  inline = isOpen === undefined,
  query: propQuery,
  status: propStatus,
  results: propResults,
  index: propIndex,
  activeIndex: propActiveIndex,
  setActiveIndex: propSetActiveIndex,
  onSelect,
}: SearchBoxProps) {
  // If inline, manage state internally
  const [internalIndex, setInternalIndex] = useState<SearchEntry[]>([])
  const [internalQuery, setInternalQuery] = useState('')
  const [internalStatus, setInternalStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [internalActiveIndex, setInternalActiveIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!inline) return

    const controller = new AbortController()
    fetch('/search-index.json', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setInternalIndex(data)
        setInternalStatus('ready')
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setInternalStatus('error')
      })

    return () => controller.abort()
  }, [inline])

  // Resolve which values to use: props or internal state
  const query = inline ? internalQuery : (propQuery ?? '')
  const status = inline ? internalStatus : (propStatus ?? 'ready')
  const index = inline ? internalIndex : (propIndex ?? [])
  const activeIndex = inline ? internalActiveIndex : (propActiveIndex ?? 0)
  const setActiveIndex = inline ? setInternalActiveIndex : (propSetActiveIndex ?? (() => {}))

  const results = inline
    ? (query.trim()
        ? index.filter((entry) => {
            const haystack = `${entry.title} ${entry.description}`.toLowerCase()
            return haystack.includes(query.toLowerCase())
          })
        : index.slice(0, 3))
    : (propResults ?? [])

  useEffect(() => {
    if (inline) {
      setInternalActiveIndex(0)
    }
  }, [query, inline])

  const handleSelect = (entry: SearchEntry) => {
    if (inline) {
      setInternalQuery('')
      router.push(`/${entry.pillar}/${entry.slug}`)
    } else {
      onSelect?.(entry)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!inline) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setInternalActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setInternalActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    }
  }

  // If not inline and not open, don't render anything
  if (!inline && !isOpen) return null

  // Highlight matches function
  const highlightText = (text: string, q: string) => {
    if (!q.trim()) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <strong key={i} className="font-bold text-[var(--color-accent)]">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  const listContent = (
    <>
      {!query.trim() ? (
        <div className="flex flex-col">
          {/* Browse by Topic */}
          <div className="px-4 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-3">
              Browse by Topic
            </h3>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar}
                  onClick={() => {
                    onClose?.()
                    router.push(`/${pillar}`)
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-fg)] transition-all hover:scale-[1.02] duration-150"
                >
                  {PILLAR_LABELS[pillar]}
                </button>
              ))}
            </div>
          </div>

          {/* Trending / Featured Stories */}
          <div className="p-2">
            <h3 className="text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider px-3 pt-2 pb-2">
              Trending / Featured Stories
            </h3>
            {index.slice(0, 3).map((entry, i) => {
              const isActive = i === activeIndex
              return (
                <button
                  key={`${entry.pillar}-${entry.slug}`}
                  onClick={() => handleSelect(entry)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-150 outline-none',
                    isActive
                      ? 'bg-[var(--color-bg-secondary)] shadow-sm border-l-2 border-[var(--color-accent)] pl-3.5'
                      : 'hover:bg-[var(--color-bg-secondary)]/40 border-l-2 border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0",
                        entry.pillar === 'ai' && "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/30",
                        entry.pillar === 'technology' && "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-900/30",
                        entry.pillar === 'productivity' && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-900/30",
                        entry.pillar === 'business' && "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30"
                      )}>
                        {PILLAR_LABELS[entry.pillar as keyof typeof PILLAR_LABELS] ?? entry.pillar}
                      </span>
                      <span className="text-[10px] text-[var(--color-fg-muted)] font-medium">
                        {entry.readingTime} min read
                      </span>
                    </div>
                    <span className="font-display font-semibold text-sm leading-snug text-[var(--color-fg)] block">
                      {entry.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* Otherwise, show filtered search results */
        <div className="p-2">
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
                  onClick={() => handleSelect(entry)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-150 outline-none',
                    isActive
                      ? 'bg-[var(--color-bg-secondary)] shadow-sm border-l-2 border-[var(--color-accent)] pl-3.5'
                      : 'hover:bg-[var(--color-bg-secondary)]/40 border-l-2 border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0",
                        entry.pillar === 'ai' && "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/30",
                        entry.pillar === 'technology' && "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-900/30",
                        entry.pillar === 'productivity' && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-900/30",
                        entry.pillar === 'business' && "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30"
                      )}>
                        {PILLAR_LABELS[entry.pillar as keyof typeof PILLAR_LABELS] ?? entry.pillar}
                      </span>
                      <span className="text-[10px] text-[var(--color-fg-muted)] font-medium">
                        {entry.readingTime} min read
                      </span>
                    </div>
                    <span className="font-display font-semibold text-sm leading-snug text-[var(--color-fg)] block">
                      {highlightText(entry.title, query)}
                    </span>
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </>
  )

  if (inline) {
    return (
      <div className="w-full flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg">
        {/* Search Input block (only for inline/standalone view) */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
          <Search className="text-[var(--color-fg-subtle)] shrink-0 size-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setInternalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search articles, topics..."
            className="flex-1 bg-transparent outline-none text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setInternalQuery('')}
              className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] p-1 rounded-md transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {listContent}
        </div>
      </div>
    )
  }

  // Dropdown floating view (for header search)
  return (
    <div className="absolute top-full right-0 mt-2 z-50 w-[92vw] sm:w-[480px] max-w-[480px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {listContent}
    </div>
  )
}

function escapeRegExp(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}
