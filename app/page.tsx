import { getAllPosts } from '@/lib/content'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { ArticleCard } from '@/components/ArticleCard'
import { RevealSection } from '@/components/RevealSection'
import Link from 'next/link'

export default function HomePage() {
  const posts = getAllPosts()

  // Distribute: hero, sidebar latest (4), featured grid (3), rest as list
  const [hero, ...rest]      = posts
  const latestNews           = rest.slice(0, 4)
  const featured             = rest.slice(4, 7)
  const latestArticles       = rest.slice(7)

  return (
    <main className="mx-auto max-w-[1280px] px-5 md:px-8 py-8 md:py-12">

      {/* ── Category pill nav ───────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--color-border)] pb-4">
        {PILLARS.map((pillar) => (
          <Link
            key={pillar}
            href={`/${pillar}`}
            className={`badge badge-${pillar} transition-opacity hover:opacity-80 text-[11px]`}
          >
            {PILLAR_LABELS[pillar]}
          </Link>
        ))}
      </div>

      {/* ── Hero + Sidebar ───────────────────────────────────── */}
      {hero && (
        <RevealSection className="grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-8 lg:gap-10 mb-12">
          {/* Top Story */}
          <div className="min-w-0">
            <p className="section-label mb-4">Top Story</p>
            <ArticleCard post={hero} variant="hero" />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-8 lg:border-l lg:border-[var(--color-border)] lg:pl-8">
            {/* Latest News */}
            {latestNews.length > 0 && (
              <div>
                <p className="section-label mb-4">Latest</p>
                <div className="flex flex-col gap-5">
                  {latestNews.map((post) => (
                    <ArticleCard
                      key={`${post.pillar}-${post.slug}`}
                      post={post}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Browse by Topic */}
            <div>
              <p className="section-label mb-4">Browse Topics</p>
              <div className="flex flex-col gap-1">
                {PILLARS.map((pillar) => (
                  <Link
                    key={pillar}
                    href={`/${pillar}`}
                    className="flex items-center justify-between py-2 px-3 rounded text-sm font-semibold hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <span>{PILLAR_LABELS[pillar]}</span>
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-5">
              <p className="font-bold text-sm mb-1">Stay ahead of the curve</p>
              <p className="text-xs text-[var(--color-fg-muted)] mb-3 leading-relaxed">
                Weekly insights on AI, tech, productivity and business — curated for ambitious people.
              </p>
              <Link
                href="#newsletter"
                className="block w-full text-center text-xs font-bold py-2.5 px-4 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Subscribe Free →
              </Link>
            </div>
          </aside>
        </RevealSection>
      )}

      {/* ── Featured Grid ────────────────────────────────────── */}
      {featured.length > 0 && (
        <RevealSection className="mb-12" delay={0.1}>
          <div className="flex items-center justify-between mb-5">
            <p className="section-label">Featured</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((post) => (
              <ArticleCard
                key={`${post.pillar}-${post.slug}`}
                post={post}
                variant="grid"
              />
            ))}
          </div>
        </RevealSection>
      )}

      {/* ── Latest Articles ──────────────────────────────────── */}
      {latestArticles.length > 0 && (
        <RevealSection delay={0.2}>
          <div className="flex items-center justify-between mb-5">
            <p className="section-label">Latest Articles</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {latestArticles.map((post) => (
              <ArticleCard
                key={`${post.pillar}-${post.slug}`}
                post={post}
                variant="list"
              />
            ))}
          </div>
        </RevealSection>
      )}

      {/* ── Newsletter ───────────────────────────────────────── */}
      <div id="newsletter" className="mt-16">
      <RevealSection delay={0.3}>
        <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-6 md:px-12 py-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">Newsletter</p>
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">Knowledge for the Ambitious</h2>
          <p className="text-[var(--color-fg-muted)] max-w-lg mx-auto text-sm leading-relaxed mb-6">
            Join thousands of students, founders, and professionals who get weekly insights on
            AI, technology, productivity, and business straight to their inbox.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            action="/contact"
            method="get"
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-bold rounded transition-colors whitespace-nowrap"
            >
              Subscribe →
            </button>
          </form>
          <p className="text-xs text-[var(--color-fg-subtle)] mt-3">No spam. Unsubscribe any time.</p>
        </div>
      </RevealSection>
      </div>
    </main>
  )
}
