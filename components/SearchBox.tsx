'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SearchEntry } from '@/lib/search-index'

type Status = 'loading' | 'ready' | 'error'

export function SearchBox() {
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setIndex(data)
        setStatus('ready')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [])

  const results = query.trim()
    ? index.filter((entry) => {
        const haystack = `${entry.title} ${entry.description}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : index

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="w-full rounded border border-[var(--color-border)] bg-transparent px-4 py-3 text-lg mb-8"
        autoFocus
      />
      {status === 'loading' && <p className="text-[var(--color-fg-muted)]">Loading...</p>}
      {status === 'error' && (
        <p className="text-[var(--color-fg-muted)]">
          Search is temporarily unavailable — please try again later.
        </p>
      )}
      {status === 'ready' && (
        <ul className="flex flex-col gap-4">
          {results.map((entry) => (
            <li key={`${entry.pillar}-${entry.slug}`}>
              <Link href={`/${entry.pillar}/${entry.slug}`} className="group block">
                <p className="font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                  {entry.title}
                </p>
                <p className="text-sm text-[var(--color-fg-muted)]">{entry.description}</p>
              </Link>
            </li>
          ))}
          {query.trim() && results.length === 0 && (
            <p className="text-[var(--color-fg-muted)]">No results for &quot;{query}&quot;.</p>
          )}
        </ul>
      )}
    </div>
  )
}
