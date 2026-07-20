import Link from 'next/link'
import type { Post } from '@/lib/content'
import { PILLAR_LABELS } from '@/lib/pillars'
import { estimateReadingTime } from '@/lib/readingTime'

interface ArticleCardProps {
  post: Post
  variant: 'hero' | 'grid' | 'compact' | 'list'
}

function PillarBadge({ pillar }: { pillar: string }) {
  return (
    <span className={`badge badge-${pillar}`}>
      {PILLAR_LABELS[pillar as keyof typeof PILLAR_LABELS] ?? pillar}
    </span>
  )
}

function DateStamp({ date }: { date: string }) {
  const d = new Date(date)
  return (
    <time
      dateTime={date}
      className="text-xs text-[var(--color-fg-subtle)] font-medium"
    >
      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </time>
  )
}

export function ArticleCard({ post, variant }: ArticleCardProps) {
  const href  = `/${post.pillar}/${post.slug}`
  const image = post.frontmatter.ogImage

  /* ── Compact (sidebar list item) ─────────────────────────── */
  if (variant === 'compact') {
    return (
      <Link href={href} className="flex gap-3 group items-start">
        {image && (
          <img
            src={image}
            alt={post.frontmatter.title}
            className="w-16 h-16 object-cover rounded shrink-0 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
        <div className="min-w-0">
          <p className="font-article text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 mb-1">
            {post.frontmatter.title}
          </p>
          <PillarBadge pillar={post.pillar} />
        </div>
      </Link>
    )
  }

  /* ── Hero (large top story) ───────────────────────────────── */
  if (variant === 'hero') {
    return (
      <Link href={href} className="group block">
        <PillarBadge pillar={post.pillar} />
        {image && (
          <div className="mt-3 overflow-hidden rounded-lg">
            <img
              src={image}
              alt={post.frontmatter.title}
              className="w-full aspect-[16/9] object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <h2 className="font-article font-semibold text-2xl md:text-3xl xl:text-4xl leading-tight mt-4 group-hover:text-[var(--color-accent)] transition-colors">
          {post.frontmatter.title}
        </h2>
        <p className="text-[var(--color-fg-muted)] mt-2 leading-relaxed line-clamp-3">
          {post.frontmatter.description}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <DateStamp date={post.frontmatter.publishedAt} />
          <span className="text-[var(--color-fg-subtle)] text-xs">
            · {estimateReadingTime(post.content)} min read
          </span>
        </div>
      </Link>
    )
  }

  /* ── List (horizontal card, image left) ──────────────────── */
  if (variant === 'list') {
    return (
      <article className="group hover-lift flex gap-4 border-b border-[var(--color-border)] pb-5 last:border-0 last:pb-0">
        {image && (
          // aria-hidden + tabIndex=-1: the heading below already links to the
          // same href, so this image link would be a second, unlabeled tab
          // stop to the identical destination for keyboard/screen-reader users.
          <Link
            href={href}
            aria-hidden="true"
            tabIndex={-1}
            className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded"
          >
            <img
              src={image}
              alt={post.frontmatter.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
            />
          </Link>
        )}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <PillarBadge pillar={post.pillar} />
            <Link href={href}>
              <h3 className="font-article font-semibold text-[15px] leading-snug mt-1 group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
                {post.frontmatter.title}
              </h3>
            </Link>
          </div>
          <DateStamp date={post.frontmatter.publishedAt} />
        </div>
      </article>
    )
  }

  /* ── Grid (standard card) ────────────────────────────────── */
  return (
    <article className="group hover-lift flex flex-col card-editorial">
      {image && (
        // aria-hidden + tabIndex=-1: see the same note in the "list" variant
        // above — the heading below links to this exact href too.
        <Link href={href} aria-hidden="true" tabIndex={-1} className="overflow-hidden block aspect-[16/9]">
          <img
            src={image}
            alt={post.frontmatter.title}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </Link>
      )}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <PillarBadge pillar={post.pillar} />
        <Link href={href} className="flex-1">
          <h3 className="font-article font-semibold leading-snug text-[15px] group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
            {post.frontmatter.title}
          </h3>
        </Link>
        <p className="text-xs text-[var(--color-fg-muted)] line-clamp-2 leading-relaxed">
          {post.frontmatter.description}
        </p>
        <DateStamp date={post.frontmatter.publishedAt} />
      </div>
    </article>
  )
}
