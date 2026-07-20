'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SearchEntry } from '@/lib/search-index'
import { Input } from '@/components/ui/input'

type Status = 'loading' | 'ready' | 'error'

export function SearchBox({ onClose }: { onClose?: () => void }) {
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
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
  }, [])

  const results = query.trim()
    ? index.filter((entry) => {
        const haystack = `${entry.title} ${entry.description}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : index

  return (
    <div>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="h-11 text-base mb-8"
        autoFocus
      />
      {status === 'loading' && <p className="text-[var(--color-fg-muted)] text-sm">Loading…</p>}
      {status === 'error' && (
        <p className="text-[var(--color-fg-muted)] text-sm">
          Search is temporarily unavailable — please try again later.
        </p>
      )}
      {status === 'ready' && (
        <ul className="flex flex-col divide-y divide-[var(--color-border)]">
          {results.map((entry) => (
            <li key={`${entry.pillar}-${entry.slug}`} className="py-4 first:pt-0">
              <Link href={`/${entry.pillar}/${entry.slug}`} className="group block" onClick={onClose}>
                <p className="font-display font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                  {entry.title}
                </p>
                <p className="text-sm text-[var(--color-fg-muted)] mt-1">{entry.description}</p>
              </Link>
            </li>
          ))}
          {query.trim() && results.length === 0 && (
            <p className="text-[var(--color-fg-muted)] text-sm">No results for &quot;{query}&quot;.</p>
          )}
        </ul>
      )}
    </div>
  )
}
