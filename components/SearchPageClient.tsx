'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PILLAR_COLORS, PILLAR_LABELS } from '@/lib/pillars'
import { Post } from '@/lib/content'

// Utility to highlight matched query characters inside the text.
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  // Escape query for regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="text-[var(--color-accent)] font-semibold">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function SearchPageClient({ posts }: { posts: Post[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState<'relevance' | 'newest'>('relevance')

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
  }, [searchParams])

  const cleanQuery = query.trim().toLowerCase()
  
  let filteredPosts = posts.map(post => {
    let score = 0
    if (!cleanQuery) {
      score = 0
    } else {
      const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedQuery, 'g')
      const titleMatches = (post.frontmatter.title.toLowerCase().match(regex) || []).length
      const descMatches = ((post.frontmatter.description || '').toLowerCase().match(regex) || []).length
      const contentMatches = ((post.content || '').toLowerCase().match(regex) || []).length
      
      score = titleMatches * 10 + descMatches * 3 + contentMatches * 1
    }
    return { ...post, score }
  })

  if (cleanQuery) {
    filteredPosts = filteredPosts.filter(p => p.score > 0)
  }

  filteredPosts.sort((a, b) => {
    if (sortBy === 'relevance' && cleanQuery) {
      if (a.score !== b.score) return b.score - a.score
    }
    const dateA = new Date(a.frontmatter.publishedAt).getTime()
    const dateB = new Date(b.frontmatter.publishedAt).getTime()
    return dateB - dateA
  })

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-fg)]">Search</h1>
        <p className="text-[var(--color-fg-muted)]">Find articles across AI, technology, productivity, and business.</p>
      </div>

      <div className="relative w-full flex items-center h-14 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl px-4 transition-all duration-300">
        <svg className="size-5 text-[var(--color-fg-muted)] mr-3 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const newVal = e.target.value
            setQuery(newVal)
            router.push('/search?q=' + encodeURIComponent(newVal))
          }}
          placeholder="Search articles..."
          className="flex-1 bg-transparent outline-none text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)] border-none focus:ring-0 p-0"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-fg-muted)] font-medium">{filteredPosts.length} matches found</span>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-fg-muted)]">Sort by:</span>
            <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-lg border border-[var(--color-border)]">
              <button
                onClick={() => setSortBy('relevance')}
                className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'relevance' ? 'bg-[var(--color-bg)] text-[var(--color-fg)] shadow-sm' : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'}`}
              >
                Relevance
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'newest' ? 'bg-[var(--color-bg)] text-[var(--color-fg)] shadow-sm' : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'}`}
              >
                Newest
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {filteredPosts.map(post => {
            const pillarColors = PILLAR_COLORS[post.frontmatter.pillar as keyof typeof PILLAR_COLORS] || { text: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-bg-secondary)]' }
            const pillarLabel = PILLAR_LABELS[post.frontmatter.pillar as keyof typeof PILLAR_LABELS] || post.frontmatter.pillar

            return (
              <Link key={post.slug} href={`/${post.frontmatter.pillar}/${post.slug}`} className="group flex flex-col sm:flex-row gap-4 p-4 -mx-4 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors">
                <img
                  src={post.frontmatter.ogImage || '/placeholder.jpg'}
                  alt=""
                  className="aspect-[3/2] w-24 h-16 sm:w-36 sm:h-24 rounded-lg shrink-0 object-cover object-top"
                />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className={`px-2 py-0.5 rounded-full ${pillarColors.bg} ${pillarColors.text}`}>
                      {pillarLabel}
                    </span>
                    <span className="text-[var(--color-fg-muted)]">
                      {new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
                    <HighlightMatch text={post.frontmatter.title} query={cleanQuery} />
                  </h3>
                  <p className="text-sm text-[var(--color-fg-muted)] line-clamp-2">
                    <HighlightMatch text={post.frontmatter.description || ''} query={cleanQuery} />
                  </p>

                </div>
              </Link>
            )
          })}
          {filteredPosts.length === 0 && (
            <div className="py-12 text-center text-[var(--color-fg-muted)]">
              No articles found matching your query.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
