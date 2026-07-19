import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { RevealSection } from '@/components/RevealSection'

// ─── Small reusable pieces ────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-fg-muted)] border-b-2 border-[var(--color-accent)] pb-1 mb-4 w-fit">
      {children}
    </p>
  )
}

function PillarTag({ pillar }: { pillar: string }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
      {PILLAR_LABELS[pillar as keyof typeof PILLAR_LABELS] ?? pillar}
    </span>
  )
}

function DateLabel({ date }: { date: string }) {
  return (
    <time dateTime={date} className="text-xs text-[var(--color-fg-subtle)]">
      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </time>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function HomePage() {
  const posts = getAllPosts()

  const [hero, ...rest] = posts
  const latestNews     = rest.slice(0, 4)   // sidebar
  const featured       = rest.slice(4, 7)   // 3-card grid
  const latestArticles = rest.slice(7)       // 2-col list

  // Category counts for the sidebar
  const categoryCounts = PILLARS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = posts.filter((post) => post.pillar === p).length
    return acc
  }, {})

  return (
    <main className="mx-auto max-w-[1280px] px-5 md:px-8 py-8">
      <div className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 lg:gap-10">

        {/* ════════════════════════════════════════════════════
            LEFT — main editorial content
            ════════════════════════════════════════════════════ */}
        <div className="min-w-0">

          {/* ── TOP STORY ─────────────────────────────────── */}
          {hero && (
            <RevealSection className="mb-8">
              <SectionLabel>Top Story</SectionLabel>

              <div className="grid sm:grid-cols-[1fr_1.5fr] gap-6 items-start">
                {/* Text column */}
                <div>
                  <PillarTag pillar={hero.pillar} />
                  <Link href={`/${hero.pillar}/${hero.slug}`} className="group block mt-1">
                    <h2 className="font-display font-bold text-2xl md:text-3xl leading-tight group-hover:text-[var(--color-accent)] transition-colors">
                      {hero.frontmatter.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-3 leading-relaxed line-clamp-4">
                    {hero.frontmatter.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
                    <DateLabel date={hero.frontmatter.publishedAt} />
                  </div>
                </div>

                {/* Image column */}
                {hero.frontmatter.ogImage && (
                  <Link href={`/${hero.pillar}/${hero.slug}`} className="block group overflow-hidden rounded-md">
                    <img
                      src={hero.frontmatter.ogImage}
                      alt={hero.frontmatter.title}
                      className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </Link>
                )}
              </div>
            </RevealSection>
          )}

          <hr className="border-[var(--color-border)] mb-8" />

          {/* ── FEATURED ──────────────────────────────────── */}
          {featured.length > 0 && (
            <RevealSection className="mb-8" delay={0.05}>
              <SectionLabel>Featured</SectionLabel>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((post) => (
                  <article key={`${post.pillar}-${post.slug}`} className="group">
                    {post.frontmatter.ogImage && (
                      <Link href={`/${post.pillar}/${post.slug}`} className="block overflow-hidden rounded-md mb-3">
                        <img
                          src={post.frontmatter.ogImage}
                          alt=""
                          className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </Link>
                    )}
                    <PillarTag pillar={post.pillar} />
                    <Link href={`/${post.pillar}/${post.slug}`} className="block mt-1">
                      <h3 className="font-bold text-sm leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
                        {post.frontmatter.title}
                      </h3>
                    </Link>
                    <div className="mt-1.5">
                      <DateLabel date={post.frontmatter.publishedAt} />
                    </div>
                  </article>
                ))}
              </div>
            </RevealSection>
          )}

          <hr className="border-[var(--color-border)] mb-8" />

          {/* ── LATEST ARTICLES ───────────────────────────── */}
          {latestArticles.length > 0 && (
            <RevealSection delay={0.1}>
              <SectionLabel>Latest Articles</SectionLabel>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {latestArticles.map((post) => (
                  <article key={`${post.pillar}-${post.slug}`} className="group flex gap-4">
                    {post.frontmatter.ogImage && (
                      <Link href={`/${post.pillar}/${post.slug}`} className="shrink-0 overflow-hidden rounded-md w-[88px] h-[88px]">
                        <img
                          src={post.frontmatter.ogImage}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                        />
                      </Link>
                    )}
                    <div className="min-w-0">
                      <PillarTag pillar={post.pillar} />
                      <Link href={`/${post.pillar}/${post.slug}`} className="block mt-0.5">
                        <h3 className="font-bold text-sm leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                          {post.frontmatter.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-[var(--color-fg-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {post.frontmatter.description}
                      </p>
                      <div className="mt-1">
                        <DateLabel date={post.frontmatter.publishedAt} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </RevealSection>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT — sidebar
            ════════════════════════════════════════════════════ */}
        <aside className="lg:border-l lg:border-[var(--color-border)] lg:pl-8">

          {/* ── LATEST NEWS ───────────────────────────────── */}
          {latestNews.length > 0 && (
            <div className="mb-8">
              <SectionLabel>Latest News</SectionLabel>

              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {latestNews.map((post) => (
                  <article key={`${post.pillar}-${post.slug}`} className="group flex gap-3 py-3 first:pt-0">
                    {post.frontmatter.ogImage && (
                      <Link href={`/${post.pillar}/${post.slug}`} className="shrink-0 overflow-hidden rounded w-[64px] h-[64px]">
                        <img
                          src={post.frontmatter.ogImage}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                        />
                      </Link>
                    )}
                    <div className="min-w-0">
                      <Link href={`/${post.pillar}/${post.slug}`}>
                        <p className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
                          {post.frontmatter.title}
                        </p>
                      </Link>
                      <div className="mt-1">
                        <DateLabel date={post.frontmatter.publishedAt} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <hr className="border-[var(--color-border)] mb-6" />

          {/* ── CATEGORIES ────────────────────────────────── */}
          <div>
            <SectionLabel>Categories</SectionLabel>

            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar}
                  href={`/${pillar}`}
                  className="flex items-center justify-between py-2.5 group"
                >
                  <span className="text-sm font-medium group-hover:text-[var(--color-accent)] transition-colors">
                    {PILLAR_LABELS[pillar]}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-fg-subtle)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded-full">
                    {categoryCounts[pillar] ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <hr className="border-[var(--color-border)] my-6" />

          {/* ── Newsletter mini CTA ───────────────────────── */}
          <div className="rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-5">
            <p className="font-bold text-sm mb-1">Stay ahead of the curve</p>
            <p className="text-xs text-[var(--color-fg-muted)] mb-4 leading-relaxed">
              Weekly insights on AI, tech, productivity and business for ambitious people.
            </p>
            <Link
              href="#newsletter"
              className="block w-full text-center text-xs font-bold py-2.5 px-4 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Subscribe Free →
            </Link>
          </div>
        </aside>
      </div>

      {/* ── NEWSLETTER full-width ──────────────────────────── */}
      <div id="newsletter" className="mt-14">
        <RevealSection delay={0.15}>
          <div className="rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-6 md:px-14 py-10 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">Newsletter</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">Knowledge for the Ambitious</h2>
            <p className="text-[var(--color-fg-muted)] max-w-lg mx-auto text-sm leading-relaxed mb-6">
              Join thousands of students, founders, and professionals who get weekly insights on AI, technology,
              productivity, and business straight to their inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="/contact" method="get">
              <input
                type="email"
                name="email"
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
