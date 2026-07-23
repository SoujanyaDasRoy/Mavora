'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { estimateReadingTime } from '@/lib/readingTime'
import { MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RevealSection } from '@/components/RevealSection'
import type { Post } from '@/lib/content'
import { PILLAR_LABELS, type Pillar } from '@/lib/pillars'

interface InteractiveArticleFeedProps {
  posts: Post[]
}

const TABS = [
  { id: 'all', label: 'All Topics' },
  { id: 'ai', label: 'AI' },
  { id: 'technology', label: 'Technology' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'business', label: 'Business' },
] as const

type TabType = 'all' | Pillar

function PillarTag({ pillar }: { pillar: string }) {
  return (
    <Badge
      variant="outline"
      className="border-[var(--color-border-strong)] text-[var(--color-fg-muted)] text-[9px] font-semibold uppercase tracking-widest rounded-[3px] px-1.5 py-0.5 h-auto leading-[1.6] bg-[var(--color-bg-secondary)]"
    >
      {PILLAR_LABELS[pillar as Pillar] ?? pillar}
    </Badge>
  )
}

function DateLabel({ date }: { date: string }) {
  return (
    <time dateTime={date} className="text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
      {new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </time>
  )
}

export default function InteractiveArticleFeed({ posts }: InteractiveArticleFeedProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const filteredPosts = activeTab === 'all'
    ? posts
    : posts.filter((p) => p.pillar === activeTab)

  return (
    <div className="flex flex-col gap-6">
      {/* Horizontal Tabs List */}
      <div className="flex items-center gap-6 mb-6 border-b border-[var(--color-border)] overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 -mb-[1px] whitespace-nowrap",
                isActive
                  ? "border-[var(--color-accent)] text-[var(--color-fg)]"
                  : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'all' ? (
        <>
          {/* Featured Section */}
          {(() => {
            const featured = filteredPosts.slice(0, 3)
            if (featured.length === 0) return null

            return (
              <RevealSection className="mb-9" delay={0.05}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {featured.map((post, idx) => (
                    <article
                      key={`${post.pillar}-${post.slug}`}
                      className={cn(
                        "group flex flex-col gap-3",
                        idx === 0 ? "col-span-2 md:col-span-2" : "col-span-1 md:col-span-1"
                      )}
                    >
                      {post.frontmatter.ogImage && (
                        <Link
                          href={`/${post.pillar}/${post.slug}`}
                          aria-hidden="true"
                          tabIndex={-1}
                          className={cn(
                            "block overflow-hidden rounded-lg w-full relative",
                            idx === 0 ? "aspect-[16/9]" : "aspect-square"
                          )}
                        >
                          <img
                            src={post.frontmatter.ogImage}
                            alt={post.frontmatter.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        </Link>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div>
                          <PillarTag pillar={post.pillar} />
                        </div>
                        <Link href={`/${post.pillar}/${post.slug}`}>
                          <h3
                            className={cn(
                              "font-article font-semibold leading-[1.3] group-hover:text-[var(--color-accent)] transition-colors line-clamp-3",
                              idx === 0
                                ? "text-[1.15rem] sm:text-[1.25rem] md:text-[1.35rem]"
                                : "text-[0.98rem] sm:text-[1.05rem]"
                            )}
                          >
                            {post.frontmatter.title}
                          </h3>
                        </Link>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--color-fg-subtle)] mt-auto pt-1">
                          {post.frontmatter.author && (
                            <>
                              <span className="font-bold uppercase text-[var(--color-accent)] tracking-wider">
                                {post.frontmatter.author}
                              </span>
                              <span className="text-[var(--color-border-strong)]">·</span>
                            </>
                          )}
                          <DateLabel date={post.frontmatter.publishedAt} />
                          <span className="text-[var(--color-border-strong)]">·</span>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-[var(--color-fg-subtle)]" />
                            <span className="font-medium tabular-nums">{(post.slug.length % 7) + 2}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </RevealSection>
            )
          })()}

          <Separator className="bg-[var(--color-border)] mb-9" />

          {/* Latest Articles Section */}
          {(() => {
            const latest = filteredPosts.slice(3)
            if (latest.length === 0) return null

            return (
              <RevealSection delay={0.1}>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                  {latest.map((post) => (
                    <article key={`${post.pillar}-${post.slug}`} className="group flex gap-3.5 items-start">
                      {post.frontmatter.ogImage && (
                        <Link
                          href={`/${post.pillar}/${post.slug}`}
                          aria-hidden="true"
                          tabIndex={-1}
                          className="shrink-0 overflow-hidden rounded-md"
                        >
                          <img
                            src={post.frontmatter.ogImage}
                            alt={post.frontmatter.title}
                            className="w-[80px] h-[60px] object-cover object-top transition-transform duration-300 group-hover:scale-[1.05]"
                          />
                        </Link>
                      )}
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <PillarTag pillar={post.pillar} />
                        <Link href={`/${post.pillar}/${post.slug}`}>
                          <h3 className="font-article font-semibold text-[0.95rem] leading-[1.3] tracking-[-0.005em] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                            {post.frontmatter.title}
                          </h3>
                        </Link>
                        <p className="text-[11.5px] text-[var(--color-fg-muted)] line-clamp-2 leading-relaxed">
                          {post.frontmatter.description}
                        </p>
                        <DateLabel date={post.frontmatter.publishedAt} />
                      </div>
                    </article>
                  ))}
                </div>
              </RevealSection>
            )
          })()}
        </>
      ) : (
        /* Specific Pillar Section */
        <>
          {filteredPosts.length > 0 ? (
            <RevealSection delay={0.05}>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {filteredPosts.map((post) => (
                  <article
                    key={`${post.pillar}-${post.slug}`}
                    className="group flex flex-col gap-3"
                  >
                    {post.frontmatter.ogImage && (
                      <Link
                        href={`/${post.pillar}/${post.slug}`}
                        aria-hidden="true"
                        tabIndex={-1}
                        className="block overflow-hidden rounded-lg aspect-[16/9] w-full relative"
                      >
                        <img
                          src={post.frontmatter.ogImage}
                          alt={post.frontmatter.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div>
                        <PillarTag pillar={post.pillar} />
                      </div>
                      <Link href={`/${post.pillar}/${post.slug}`}>
                        <h3 className="font-article font-semibold text-[1.15rem] leading-[1.3] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                          {post.frontmatter.title}
                        </h3>
                      </Link>
                      <p className="text-[13px] text-[var(--color-fg-muted)] line-clamp-2 leading-relaxed">
                        {post.frontmatter.description}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--color-fg-subtle)] mt-auto pt-1">
                        {post.frontmatter.author && (
                          <>
                            <span className="font-bold uppercase text-[var(--color-accent)] tracking-wider">
                              {post.frontmatter.author}
                            </span>
                            <span className="text-[var(--color-border-strong)]">·</span>
                          </>
                        )}
                        <DateLabel date={post.frontmatter.publishedAt} />
                        <span className="text-[var(--color-border-strong)]">·</span>
                        <span>{estimateReadingTime(post.content)} min read</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </RevealSection>
          ) : (
            <div className="text-center py-12 text-[var(--color-fg-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
              No articles found in this category.
            </div>
          )}
        </>
      )}
    </div>
  )
}
