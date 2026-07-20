import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { RevealSection } from '@/components/RevealSection'
import { SectionLabel } from '@/components/SectionLabel'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { estimateReadingTime } from '@/lib/readingTime'

// ─── Pillar badge — neutral, no red ───────────────────────────
function PillarTag({ pillar }: { pillar: string }) {
  return (
    <Badge
      variant="outline"
      className="border-[var(--color-border-strong)] text-[var(--color-fg-muted)] text-[9px] font-semibold uppercase tracking-widest rounded-[3px] px-1.5 py-0 h-auto leading-[1.6] bg-[var(--color-bg-secondary)]"
    >
      {PILLAR_LABELS[pillar as keyof typeof PILLAR_LABELS] ?? pillar}
    </Badge>
  )
}

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

  const [hero, ...rest] = posts
  const latestNews     = rest.slice(0, 4)
  const featured       = rest.slice(4, 7)
  const latestArticles = rest.slice(7)

  const categoryCounts = PILLARS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = posts.filter((post) => post.pillar === p).length
    return acc
  }, {})

  return (
    <main className="mx-auto max-w-[1280px] px-5 md:px-8 py-8 md:py-10">

      <div className="grid lg:grid-cols-[1fr_296px] gap-10 lg:gap-12 items-start">

        {/* ── LEFT ────────────────────────────────────────────── */}
        <div className="min-w-0">

          {/* TOP STORY */}
          {hero && (
            <RevealSection className="mb-9">
              <SectionLabel>Top Story</SectionLabel>

              <div className="grid sm:grid-cols-[6fr_5fr] gap-7 items-center">

                <div className="flex flex-col gap-3">
                  <PillarTag pillar={hero.pillar} />
                  <Link href={`/${hero.pillar}/${hero.slug}`} className="group">
                    <h2 className="font-article font-semibold text-[1.9rem] md:text-[2.2rem] leading-[1.1] tracking-[-0.01em] group-hover:text-[var(--color-fg-muted)] transition-colors">
                      {hero.frontmatter.title}
                    </h2>
                  </Link>
                  <p className="text-[13.5px] text-[var(--color-fg-muted)] leading-[1.65] line-clamp-3">
                    {hero.frontmatter.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-subtle)]">
                    {hero.frontmatter.author && (
                      <>
                        <span className="font-medium text-[var(--color-fg-muted)]">
                          {hero.frontmatter.author}
                        </span>
                        <span className="text-[var(--color-border-strong)]">·</span>
                      </>
                    )}
                    <DateLabel date={hero.frontmatter.publishedAt} />
                    <span className="text-[var(--color-border-strong)]">·</span>
                    <span>{estimateReadingTime(hero.content)} min read</span>
                  </div>
                </div>

                {hero.frontmatter.ogImage && (
                  // aria-hidden + tabIndex=-1: the title above already links here —
                  // without this, keyboard/screen-reader users hit the same
                  // destination twice in a row with this one announcing nothing.
                  <Link
                    href={`/${hero.pillar}/${hero.slug}`}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="block group overflow-hidden rounded-lg"
                  >
                    <img
                      src={hero.frontmatter.ogImage}
                      alt={hero.frontmatter.title}
                      className="w-full h-[220px] sm:h-[260px] object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </Link>
                )}
              </div>
            </RevealSection>
          )}

          <Separator className="bg-[var(--color-border)] mb-9" />

          {/* FEATURED */}
          {featured.length > 0 && (
            <RevealSection className="mb-9" delay={0.05}>
              <SectionLabel>Featured</SectionLabel>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((post) => (
                  <article key={`${post.pillar}-${post.slug}`} className="group flex flex-col gap-2.5">
                    {post.frontmatter.ogImage && (
                      // aria-hidden + tabIndex=-1: heading below links here too.
                      <Link
                        href={`/${post.pillar}/${post.slug}`}
                        aria-hidden="true"
                        tabIndex={-1}
                        className="block overflow-hidden rounded-lg"
                      >
                        <img
                          src={post.frontmatter.ogImage}
                          alt={post.frontmatter.title}
                          className="w-full h-[160px] object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </Link>
                    )}
                    <PillarTag pillar={post.pillar} />
                    <Link href={`/${post.pillar}/${post.slug}`}>
                      <h3 className="font-article font-semibold text-[1rem] leading-[1.3] tracking-[-0.005em] group-hover:text-[var(--color-fg-muted)] transition-colors line-clamp-3">
                        {post.frontmatter.title}
                      </h3>
                    </Link>
                    <DateLabel date={post.frontmatter.publishedAt} />
                  </article>
                ))}
              </div>
            </RevealSection>
          )}

          <Separator className="bg-[var(--color-border)] mb-9" />

          {/* LATEST ARTICLES */}
          {latestArticles.length > 0 && (
            <RevealSection delay={0.1}>
              <SectionLabel>Latest Articles</SectionLabel>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {latestArticles.map((post) => (
                  <article key={`${post.pillar}-${post.slug}`} className="group flex gap-3.5 items-start">
                    {post.frontmatter.ogImage && (
                      // aria-hidden + tabIndex=-1: heading below links here too.
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
                        <h3 className="font-article font-semibold text-[0.95rem] leading-[1.3] tracking-[-0.005em] group-hover:text-[var(--color-fg-muted)] transition-colors line-clamp-2">
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
          )}
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
                      // aria-hidden + tabIndex=-1: title below links here too.
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
                        <p className="font-article text-[13.5px] font-semibold leading-[1.3] group-hover:text-[var(--color-fg-muted)] transition-colors line-clamp-3">
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

          {/* CATEGORIES */}
          <div className="mb-7">
            <SectionLabel>Categories</SectionLabel>

            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar}
                  href={`/${pillar}`}
                  className="flex items-center justify-between py-2.5 group"
                >
                  <span className="text-[13px] font-medium group-hover:text-[var(--color-fg)] transition-colors">
                    {PILLAR_LABELS[pillar]}
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-[var(--color-fg-subtle)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                    {categoryCounts[pillar] ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <Separator className="bg-[var(--color-border)] mb-7" />

          {/* Newsletter mini CTA */}
          <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-5">
            <p className="font-display font-semibold text-[0.9rem] tracking-[-0.01em] mb-1.5">
              Stay ahead of the curve
            </p>
            <p className="text-[11.5px] text-[var(--color-fg-muted)] mb-4 leading-relaxed">
              Weekly insights on AI, tech, productivity and business.
            </p>
            {/* Dark CTA — not red, keeps page calm. Plain Link (not Button's
                render-as-Link) since base-ui's Button injects type="button"
                onto whatever element it renders as, which is invalid on <a>. */}
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
            <h2 className="font-display font-bold text-[1.6rem] md:text-[2rem] tracking-[-0.025em] leading-[1.15] mb-3">
              Knowledge for the Ambitious
            </h2>
            <p className="text-[var(--color-fg-muted)] max-w-md mx-auto text-[13.5px] leading-relaxed mb-7">
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
              No spam. Unsubscribe any time.
            </p>
          </div>
        </RevealSection>
      </div>
    </main>
  )
}
