'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SearchEntry } from '@/lib/search-index'

export function SearchBox() {
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setIndex)
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
    </div>
  )
}
