import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Document, Time } from '@carbon/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { requireRole } from '@/lib/role'
import { getDb } from '@/lib/cloudflare'
import { listArticles, type Article } from '@/lib/articles'
import { getWriter } from '@/lib/writers'
import { cn } from '@/lib/utils'

// Colors mirror the --color-pillar-* tokens in globals.css so badges stay
// consistent with the chart/article surfaces across the app.
const PILLAR_STYLES: Record<Article['pillar'], { label: string; color: string }> = {
  ai: { label: 'AI', color: '#6C4BB4' },
  technology: { label: 'Technology', color: '#1A7492' },
  productivity: { label: 'Productivity', color: '#2C7A3C' },
  business: { label: 'Business', color: '#CF2743' },
}

const STATUS_STYLES: Record<Article['status'], { bg: string; fg: string }> = {
  draft: {
    bg: 'color-mix(in srgb, var(--color-fg-subtle) 18%, transparent)',
    fg: 'var(--color-fg-muted)',
  },
  published: {
    bg: 'color-mix(in srgb, var(--color-positive) 20%, transparent)',
    fg: 'var(--color-positive)',
  },
}

function formatUpdated(iso: string): string {
  // D1 stores `YYYY-MM-DD HH:MM:SS` (UTC). Re-parse to avoid the browser
  // // shifting via the local TZ — we display the literal stored time.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return iso
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]} UTC`
}

export default async function ArticlesListPage() {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) redirect('/login')

  const db = getDb()
  const writer = guard.writer

  const articles = await listArticles(
    db,
    writer.role === 'admin' ? {} : { authorId: writer.id }
  )

  // Admin view: enrich rows with author display names for writers whose
  // id isn't the current user. (For their own articles, `authorName` is
  // already populated by the JOIN in `listArticles`.) One batched lookup
  // is enough — avoids N+1 getWriter calls.
  let authorNames: Record<string, string> = {}
  if (writer.role === 'admin') {
    const seen = new Set<string>()
    for (const a of articles) {
      if (a.authorId && !seen.has(a.authorId)) {
        seen.add(a.authorId)
      }
    }
    if (seen.size) {
      const placeholders = Array.from(seen).map(() => '?').join(',')
      const rows = await db
        .prepare(`SELECT id, display_name FROM writers WHERE id IN (${placeholders})`)
        .bind(...seen)
        .all<{ id: string; display_name: string }>()
      for (const row of rows.results ?? []) {
        authorNames[row.id] = row.display_name
      }
    }
  }

  const draftCount = articles.filter((a) => a.status === 'draft').length
  const publishedCount = articles.filter((a) => a.status === 'published').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Articles
          </h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {writer.role === 'admin' ? 'All articles across the team' : 'Your drafts and published work'} ·{' '}
            <span className="text-[var(--color-fg)]">{draftCount} drafts</span> ·{' '}
            <span className="text-[var(--color-fg)]">{publishedCount} published</span>
          </p>
        </div>
        <ShimmerButton
          href="/articles/new"
          background="var(--color-accent)"
          shimmerColor="rgba(255,255,255,0.35)"
        >
          + New Article
        </ShimmerButton>
      </div>

      {/* Empty state */}
      {articles.length === 0 && (
        <MagicCard
          className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] p-12 text-center"
          gradientSize={220}
          gradientFrom="var(--color-accent)"
          gradientTo="var(--color-accent-hover)"
          gradientOpacity={0.12}
        >
          <div className="mx-auto size-14 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] mb-4">
            <Document className="size-7" />
          </div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            No articles yet
          </h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)] max-w-md mx-auto">
            Start your first draft. Autosave kicks in as soon as you begin typing.
          </p>
          <Button
            render={
              <Link href="/articles/new" className="inline-flex items-center" />
            }
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            + New Article
          </Button>
        </MagicCard>
      )}

      {/* Table — dense, Stripe-style. No MagicCard glow, no rounded-xl —
       * flat surface, tight rows, sticky header, hover rail. */}
      {articles.length > 0 && (
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="sticky top-14 z-10 grid grid-cols-12 gap-4 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-fg-subtle)',
            }}
          >
            <div className="col-span-6">Title</div>
            <div className="col-span-2">Pillar</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Author</div>
            <div className="col-span-1 text-right">Updated</div>
          </div>

          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {articles.map((article) => {
              const pillar = PILLAR_STYLES[article.pillar]
              const status = STATUS_STYLES[article.status]
              const authorName =
                article.authorName ?? (article.authorId && authorNames[article.authorId]) ?? 'Unknown'

              return (
                <li key={article.id} className="group relative">
                  <Link
                    href={`/articles/${article.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-2.5 items-center text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                  >
                    {/* Active rail — appears on hover, accent on the left
                     * edge. Mirrors the sidebar's active treatment so the
                     * whole app shares one "what is selected" gesture. */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                    <div className="col-span-6 min-w-0">
                      <p className="font-medium text-[var(--color-fg)] truncate">{article.title}</p>
                      <p className="text-[11px] text-[var(--color-fg-subtle)] mt-0.5 truncate">/{article.slug}</p>
                    </div>
                    <div className="col-span-2">
                      <Badge
                        variant="outline"
                        className="border-transparent"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${pillar.color} 18%, transparent)`,
                          color: pillar.color,
                        }}
                      >
                        {pillar.label}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: status.bg, color: status.fg }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: status.fg }}
                          aria-hidden="true"
                        />
                        {article.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-[var(--color-fg-muted)] truncate">
                      {authorName}
                    </div>
                    <div className="col-span-1 text-right text-[11px] text-[var(--color-fg-subtle)] flex items-center justify-end gap-1 tabular-nums">
                      <Time className="size-3" />
                      <span>{formatUpdated(article.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Footer hint */}
      {articles.length > 0 && (
        <p className="text-[11px] text-[var(--color-fg-subtle)] text-center">
          Click any row to edit · <ArrowRight className="inline size-3" />
        </p>
      )}
    </div>
  )
}