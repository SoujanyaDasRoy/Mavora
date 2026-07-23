import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { PILLAR_LABELS } from '@/lib/pillars'
import { RevealSection } from '@/components/RevealSection'
import { SectionLabel } from '@/components/SectionLabel'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { estimateReadingTime } from '@/lib/readingTime'
import InteractiveArticleFeed from '@/components/InteractiveArticleFeed'

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

  const hero = posts[0]
  const rest = posts.slice(1)
  const latestNews = rest.slice(0, 3)
  const feedPosts = rest.slice(3)

  return (
    <main className="mx-auto max-w-[1440px] px-5 md:px-8 py-8 md:py-10">

      <div className="grid lg:grid-cols-[1fr_296px] gap-10 lg:gap-12 items-start">

        {/* ── LEFT ────────────────────────────────────────────── */}
        <div className="min-w-0">

          {/* TOP STORY */}
          {hero && (
            <RevealSection className="mb-8">
              <SectionLabel>Top Story</SectionLabel>

              <div className="relative w-full h-[300px] sm:h-[380px] md:h-[440px] rounded-xl overflow-hidden group flex items-end">
                {hero.frontmatter.ogImage && (
                  <img
                    src={hero.frontmatter.ogImage}
                    alt={hero.frontmatter.title}
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                )}
                
                {/* Dark gradient overlay for contrast and readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="relative z-10 p-5 sm:p-6 md:p-8 w-full flex flex-col gap-2">
                  <div>
                    <Badge
                      className="border-none bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-white text-[9px] font-semibold uppercase tracking-widest rounded-[3px] px-1.5 py-0.5 h-auto leading-[1.6]"
                    >
                      {PILLAR_LABELS[hero.pillar as keyof typeof PILLAR_LABELS] ?? hero.pillar}
                    </Badge>
                  </div>
                  
                  <Link href={`/${hero.pillar}/${hero.slug}`} className="block max-w-4xl">
                    <h2 className="font-article font-bold text-white text-[1.8rem] sm:text-[2.2rem] md:text-[2.8rem] leading-[1.1] tracking-[-0.01em] hover:text-neutral-200 transition-colors">
                      {hero.frontmatter.title}
                    </h2>
                  </Link>

                  <p className="text-[13px] text-white/80 max-w-2xl leading-[1.6] line-clamp-1 sm:line-clamp-2">
                    {hero.frontmatter.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-[11px] text-white/60">
                      {hero.frontmatter.author && (
                        <>
                          <span className="font-medium text-white/80">
                            {hero.frontmatter.author}
                          </span>
                          <span className="text-white/40">·</span>
                        </>
                      )}
                      <time dateTime={hero.frontmatter.publishedAt} className="tabular-nums">
                        {new Date(hero.frontmatter.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <span className="text-white/40">·</span>
                      <span>{estimateReadingTime(hero.content)} min read</span>
                    </div>

                    <Link
                      href={`/${hero.pillar}/${hero.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-white/20 hover:bg-white/30 backdrop-blur transition-all"
                    >
                      Read Article →
                    </Link>
                  </div>
                </div>
              </div>
            </RevealSection>
          )}

          {/* INTERACTIVE ARTICLE FEED */}
          <InteractiveArticleFeed posts={feedPosts} />
        </div>

        {/* ── RIGHT — sidebar ──────────────────────────────────── */}
        <aside className="lg:border-l lg:border-[var(--color-border)] lg:pl-8 lg:sticky lg:top-[86px] lg:self-start">

          {/* LATEST NEWS */}
          {latestNews.length > 0 && (
            <div className="mb-7">
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
                      <DateLabel date={post.frontmatter.publishedAt} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-[var(--color-border)] mb-7" />

          {/* Newsletter mini CTA */}
          <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-5">
            <p className="font-display font-semibold text-[0.9rem] tracking-[-0.01em] mb-1.5">
              Stay ahead of the curve
            </p>
            <p className="text-[11.5px] text-[var(--color-fg-muted)] mb-4 leading-relaxed">
              Weekly insights on AI, tech, productivity and business.
            </p>
            <Link
              href="#newsletter"
              className={cn(
                buttonVariants({ size: 'default' }),
                'w-full bg-[var(--color-fg)] hover:bg-[var(--color-fg-muted)] text-[var(--color-bg)] text-[12px] font-bold h-8 rounded-md transition-colors'
              )}
            >
              Subscribe Free →
            </Link>
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
