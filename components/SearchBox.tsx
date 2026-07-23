'use client'

import { useEffect, useState, useRef } from 'react'
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
  // Internal state management when props are not provided (e.g. standalone/overlay)
  const [internalIndex, setInternalIndex] = useState<SearchEntry[]>([])
  const [internalQuery, setInternalQuery] = useState('')
  const [internalStatus, setInternalStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [internalActiveIndex, setInternalActiveIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const shouldFetch = inline || isOpen

  // Fetch search index
  useEffect(() => {
    if (!shouldFetch) return

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
  }, [shouldFetch])

  // Resolve which values to use: props or internal state
  const query = propQuery !== undefined ? propQuery : internalQuery
  const status = propStatus !== undefined ? propStatus : internalStatus
  const index = propIndex !== undefined ? propIndex : internalIndex
  const activeIndex = propActiveIndex !== undefined ? propActiveIndex : internalActiveIndex
  const setActiveIndex = propSetActiveIndex !== undefined ? propSetActiveIndex : setInternalActiveIndex

  const results = propResults !== undefined
    ? propResults
    : (query.trim()
        ? index.filter((entry) => {
            const haystack = `${entry.title} ${entry.description}`.toLowerCase()
            return haystack.includes(query.toLowerCase())
          })
        : index.slice(0, 3))

  // Reset active index when query changes
  useEffect(() => {
    if (propQuery === undefined) {
      setInternalActiveIndex(0)
    }
  }, [query, propQuery])

  // Prevent background scrolling when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  // Focus input on mount / open
  useEffect(() => {
    if (inline || isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [inline, isOpen])

  // Global key listener for Escape when open
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen, onClose])

  const handleSelect = (entry: SearchEntry) => {
    if (onSelect) {
      onSelect(entry)
    } else {
      setInternalQuery('')
      router.push(`/${entry.pillar}/${entry.slug}`)
      onClose?.()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(Math.min(activeIndex + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(Math.max(activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose?.()
    }
  }

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

  // If not inline and not open, don't render anything
  if (!inline && !isOpen) return null

  // 1. Full-screen overlay takeover view
  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--color-bg)]/98 backdrop-blur-md overflow-y-auto animate-fade-in">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 w-full min-h-screen flex flex-col justify-start animate-slide-up">
          {/* Top layout: Giant input and close button */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6 md:pb-8 gap-6">
            <div className="flex-1 flex items-center gap-4">
              <Search className="size-8 md:size-12 text-[var(--color-fg-subtle)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setInternalQuery(e.target.value)
                  setInternalActiveIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search articles, topics..."
                className="w-full bg-transparent outline-none text-3xl md:text-5xl font-extrabold text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] border-none focus:ring-0 p-0"
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 md:p-3 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-all duration-200"
              aria-label="Close search"
            >
              <X className="size-8 md:size-10" />
            </button>
          </div>

          {/* Body layout: Split Grid */}
          <div className="grid md:grid-cols-[1fr_320px] gap-12 mt-12">
            {/* Left side: Results */}
            <div className="min-w-0">
              {!query.trim() ? (
                <div className="py-12 text-left">
                  <h4 className="text-xl font-bold text-[var(--color-fg-muted)] mb-3 font-display">Search Mavora</h4>
                  <p className="text-[var(--color-fg-subtle)] text-base max-w-md">
                    Type your search query to find articles across artificial intelligence, technology, productivity, and business.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {status === 'loading' && (
                    <p className="text-[var(--color-fg-muted)] text-lg py-12 flex items-center gap-3">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--color-accent)] border-t-transparent" />
                      Loading index…
                    </p>
                  )}
                  {status === 'error' && (
                    <p className="text-[var(--color-fg-muted)] text-lg py-12">
                      Search is temporarily unavailable — please try again later.
                    </p>
                  )}
                  {status === 'ready' && results.length === 0 && (
                    <p className="text-[var(--color-fg-muted)] text-lg py-12">
                      No results found for &quot;<span className="text-[var(--color-fg)] font-medium">{query}</span>&quot;.
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
                            'w-full text-left flex flex-col gap-2 rounded-2xl p-6 transition-all duration-300 outline-none border border-transparent',
                            isActive
                              ? 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] shadow-sm'
                              : 'hover:bg-[var(--color-bg-secondary)]/30'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0",
                              entry.pillar === 'ai' && "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/30",
                              entry.pillar === 'technology' && "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-900/30",
                              entry.pillar === 'productivity' && "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-900/30",
                              entry.pillar === 'business' && "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30"
                            )}>
                              {PILLAR_LABELS[entry.pillar as keyof typeof PILLAR_LABELS] ?? entry.pillar}
                            </span>
                            <span className="text-xs text-[var(--color-fg-muted)] font-medium">
                              {entry.readingTime} min read
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-xl md:text-2xl leading-snug text-[var(--color-fg)]">
                            {highlightText(entry.title, query)}
                          </h3>
                          {entry.description && (
                            <p className="text-sm md:text-base text-[var(--color-fg-muted)] line-clamp-2">
                              {highlightText(entry.description, query)}
                            </p>
                          )}
                        </button>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Right side: Discovery */}
            <div className="flex flex-col gap-10 border-t md:border-t-0 md:border-l border-[var(--color-border)] pt-10 md:pt-0 md:pl-10">
              {/* Browse by Topic */}
              <div>
                <h3 className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider mb-4 font-display">
                  Browse by Topic
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {PILLARS.map((pillar) => (
                    <button
                      key={pillar}
                      onClick={() => {
                        onClose?.()
                        router.push(`/${pillar}`)
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-fg)] transition-all hover:scale-[1.03] duration-150"
                    >
                      {PILLAR_LABELS[pillar]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Stories */}
              <div>
                <h3 className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider mb-4 font-display">
                  Trending Stories
                </h3>
                <div className="flex flex-col gap-5">
                  {index.slice(0, 3).map((entry) => (
                    <button
                      key={`${entry.pillar}-${entry.slug}`}
                      onClick={() => handleSelect(entry)}
                      className="w-full text-left group flex flex-col gap-1.5 transition-all duration-200 outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[8px] font-semibold uppercase tracking-widest px-1 py-0.2 rounded border shrink-0",
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
                      <h4 className="font-display font-semibold text-sm leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                        {entry.title}
                      </h4>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Compact Inline search view (used in /search page)
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

  return (
    <div className="w-full flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-lg animate-fade-in">
      {/* Search Input block (only for inline/standalone view) */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
        <Search className="text-[var(--color-fg-subtle)] shrink-0 size-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setInternalQuery(e.target.value)
            setInternalActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search articles, topics..."
          className="flex-1 bg-transparent outline-none text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] border-none focus:ring-0 p-0"
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

function escapeRegExp(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}
