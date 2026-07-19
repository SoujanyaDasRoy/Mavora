import Link from 'next/link'
import type { Post } from '@/lib/content'

interface ArticleCardProps {
  post: Post
  variant: 'hero' | 'grid' | 'compact'
}

const PILLAR_LABELS: Record<Post['pillar'], string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

export function ArticleCard({ post, variant }: ArticleCardProps) {
  const href = `/${post.pillar}/${post.slug}`
  const image = post.frontmatter.ogImage

  if (variant === 'compact') {
    return (
      <Link href={href} className="flex gap-3 group">
        {image && (
          <img
            src={image}
            alt=""
            className="w-16 h-16 object-cover rounded shrink-0 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <div>
          <p className="text-sm font-semibold group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {post.frontmatter.title}
          </p>
          <p className="text-xs text-[var(--color-fg-muted)] mt-1">{post.frontmatter.publishedAt}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'hero') {
    return (
      <Link href={href} className="group block">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] mb-2">
          {PILLAR_LABELS[post.pillar]}
        </p>
        {image && (
          <img
            src={image}
            alt=""
            className="w-full aspect-[16/9] object-cover rounded-lg mb-4 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight group-hover:text-[var(--color-accent)] transition-colors">
          {post.frontmatter.title}
        </h2>
        <p className="text-[var(--color-fg-muted)] mt-2">{post.frontmatter.description}</p>
        <p className="text-sm text-[var(--color-fg-muted)] mt-3">{post.frontmatter.publishedAt}</p>
      </Link>
    )
  }

  return (
    <Link href={href} className="group block">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] mb-2">
        {PILLAR_LABELS[post.pillar]}
      </p>
      {image && (
        <img
          src={image}
          alt=""
          className="w-full aspect-[16/9] object-cover rounded-lg mb-3 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      <h3 className="font-bold leading-snug group-hover:text-[var(--color-accent)] transition-colors">
        {post.frontmatter.title}
      </h3>
      <p className="text-sm text-[var(--color-fg-muted)] mt-2">{post.frontmatter.publishedAt}</p>
    </Link>
  )
}
