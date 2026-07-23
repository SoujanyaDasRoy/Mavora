import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { PILLAR_LABELS } from '@/lib/pillars'
import { RevealSection } from '@/components/RevealSection'
import { SectionLabel } from '@/components/SectionLabel'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { estimateReadingTime } from '@/lib/readingTime'
import InteractiveArticleFeed from '@/components/InteractiveArticleFeed'
import { TopStoriesCarousel } from '@/components/TopStoriesCarousel'

// ─── Date label ────────────────────────────────────────────────
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

// ─── Page ──────────────────────────────────────────────────────
export default function HomePage() {
  const posts = getAllPosts()

  const topStories = posts.slice(0, 3)
  const rest = posts.slice(3)
  const latestNews = rest.slice(0, 3)
  const feedPosts = rest.slice(3)
  const popularPosts = posts.slice(0, 3)

  return (
    <main className="mx-auto max-w-[1440px] px-5 md:px-8 py-8 md:py-10">

      <div className="grid lg:grid-cols-[1fr_296px] gap-10 lg:gap-12 items-start">

        {/* ── LEFT ────────────────────────────────────────────── */}
        <div className="min-w-0">

          {/* TOP STORIES */}
          {topStories.length > 0 && (
            <RevealSection className="mb-8">
              <SectionLabel>Top Stories</SectionLabel>
              <TopStoriesCarousel posts={topStories} />
            </RevealSection>
          )}

          {/* INTERACTIVE ARTICLE FEED */}
          <InteractiveArticleFeed posts={feedPosts} />
        </div>

        {/* ── RIGHT — sidebar ──────────────────────────────────── */}
        <aside className="lg:border-l lg:border-[var(--color-border)] lg:pl-8 lg:sticky lg:top-[86px] lg:self-start">
          <div className="flex flex-col gap-12">

            {/* LATEST NEWS */}
            {latestNews.length > 0 && (
              <div>
                <SectionLabel>Latest News</SectionLabel>

                <div className="flex flex-col divide-y divide-[var(--color-border)]">
                  {latestNews.map((post) => (
                    <article key={`${post.pillar}-${post.slug}`} className="group flex gap-3 py-3 first:pt-0">
                      {post.frontmatter.ogImage && (
                        <Link
                          href={`/${post.pillar}/${post.slug}`}
                          aria-hidden="true"
                          tabIndex={-1}
                          className="shrink-0 overflow-hidden rounded"
                        >
                          <img
                            src={post.frontmatter.ogImage}
                            alt={post.frontmatter.title}
                            className="w-[60px] h-[60px] object-cover object-top transition-transform duration-300 group-hover:scale-[1.06]"
                          />
                        </Link>
                      )}
                      <div className="min-w-0 flex flex-col gap-1">
                        <Link href={`/${post.pillar}/${post.slug}`}>
                          <p className="font-article text-[13.5px] font-semibold leading-[1.3] group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
                            {post.frontmatter.title}
                          </p>
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-subtle)]">
                          <DateLabel date={post.frontmatter.publishedAt} />
                          <span>•</span>
                          <span>{estimateReadingTime(post.content)} min read</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* POPULAR STORIES */}
            {popularPosts.length > 0 && (
              <div>
                <SectionLabel>Popular Stories</SectionLabel>

                <div className="flex flex-col divide-y divide-[var(--color-border)]">
                  {popularPosts.map((post, index) => {
                    const rank = String(index + 1).padStart(2, '0')
                    return (
                      <article key={`popular-${post.pillar}-${post.slug}`} className="group flex gap-3 py-3 first:pt-0">
                        <span className="font-mono text-[13px] font-medium text-[var(--color-fg-subtle)] opacity-60 shrink-0 w-5 pt-0.5">
                          {rank}
                        </span>
                        <div className="min-w-0 flex flex-col gap-1">
                          <Link href={`/${post.pillar}/${post.slug}`}>
                            <p className="font-article text-[13.5px] font-semibold leading-[1.3] group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
                              {post.frontmatter.title}
                            </p>
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-subtle)]">
                            <DateLabel date={post.frontmatter.publishedAt} />
                            <span>•</span>
                            <span>{estimateReadingTime(post.content)} min read</span>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </aside>
      </div>

      {/* ── NEWSLETTER full-width ──────────────────────────── */}
      <div id="newsletter" className="mt-16">
        <RevealSection delay={0.15}>
          <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-8 md:px-14 py-12 text-center">
            {/* Neutral label — no red badge */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)] mb-3">
              Newsletter
            </p>
            <h2 className="font-inter font-bold text-[1.6rem] md:text-[2.2rem] tracking-[-0.025em] leading-[1.15] mb-3">
              Join 4,200+ Knowledge Seekers
            </h2>
            <p className="text-[var(--color-fg-muted)] max-w-md mx-auto text-[13.5px] leading-relaxed mb-4">
              Join thousands of students, founders, and professionals who get weekly insights
              on AI, technology, productivity, and business.
            </p>

            <form
              className="flex flex-col sm:flex-row gap-2.5 max-w-[380px] mx-auto"
              action="/contact"
              method="get"
            >
              <Input
                type="email"
                name="email"
                placeholder="your@email.com"
                className="flex-1 h-9 text-[13px] border-[var(--color-border)] bg-[var(--color-bg)] rounded-md"
                required
              />
              {/* ONE red element on the page — the primary action */}
              <Button
                type="submit"
                className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-[12px] font-bold h-9 px-5 whitespace-nowrap rounded-md"
              >
                Subscribe →
              </Button>
            </form>
            <p className="text-[11px] text-[var(--color-fg-subtle)] mt-3">
              Zero spam. Only high-signal insights. Unsubscribe in one click at any time.
            </p>
          </div>
        </RevealSection>
      </div>
    </main>
  )
}
