import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { PILLARS, type Pillar, getAllPosts, getPostBySlug } from '@/lib/content'
import { PILLAR_LABELS } from '@/lib/pillars'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { TwitterEmbed } from '@/components/TwitterEmbed'
import { Container } from '@/components/Container'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { estimateReadingTime } from '@/lib/readingTime'

// Disable dynamic params so unknown slugs get a 404 (required with output:'export')
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ pillar: post.pillar, slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pillar: string; slug: string }>
}): Promise<Metadata> {
  const { pillar: pillarParam, slug } = await params
  // Mirrors the page component's own not-found handling below: verify the
  // pillar segment and the post both exist before touching `post.frontmatter`.
  if (!PILLARS.includes(pillarParam as Pillar)) notFound()
  const post = getPostBySlug(pillarParam as Pillar, slug)
  if (!post) notFound()

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: post.frontmatter.ogImage ? [post.frontmatter.ogImage] : undefined,
      type: 'article',
      publishedTime: post.frontmatter.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: post.frontmatter.ogImage ? [post.frontmatter.ogImage] : undefined,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ pillar: string; slug: string }>
}) {
  const { pillar: pillarParam, slug } = await params
  if (!PILLARS.includes(pillarParam as Pillar)) notFound()
  const post = getPostBySlug(pillarParam as Pillar, slug)
  if (!post) notFound()

  const label = PILLAR_LABELS[post.pillar] ?? post.pillar
  const readingMinutes = estimateReadingTime(post.content)
  const publishedDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <main>
      <Container narrow className="pb-16">
        <article>
          <div className="pt-8 md:pt-10 pb-6">
            <Link href={`/${post.pillar}`} className="inline-block">
              <Badge
                variant="outline"
                className="border-[var(--color-border-strong)] text-[var(--color-fg-muted)] text-[10px] font-semibold uppercase tracking-widest rounded-[3px] px-2 py-0.5 h-auto leading-[1.6] bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] hover:border-[var(--color-fg-muted)] transition-colors"
              >
                {label}
              </Badge>
            </Link>
            <h1 className="font-article font-semibold text-[2.25rem] md:text-[3.1rem] leading-[1.08] tracking-[-0.01em] mt-3 mb-4">
              {post.frontmatter.title}
            </h1>
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-fg-muted)]">
              {post.frontmatter.author && (
                <>
                  <span className="font-medium text-[var(--color-fg)]">{post.frontmatter.author}</span>
                  <span className="text-[var(--color-border-strong)]">·</span>
                </>
              )}
              <time dateTime={post.frontmatter.publishedAt}>{publishedDate}</time>
              <span className="text-[var(--color-border-strong)]">·</span>
              <span>{readingMinutes} min read</span>
            </div>

            {/* Cover image sits inside the same reading column as the title
                instead of bleeding edge-to-edge across the viewport — a
                1920px monitor turned the old full-bleed 21:9 banner into a
                wall of photo before any text was visible. */}
            {post.frontmatter.ogImage && (
              <img
                src={post.frontmatter.ogImage}
                alt={post.frontmatter.title}
                className="w-full aspect-[16/9] object-cover object-top rounded-xl mt-7"
              />
            )}

            <Separator className="bg-[var(--color-border)] mt-8" />
          </div>
          <div className="prose dark:prose-invert max-w-none prose-a:text-[var(--color-accent)] prose-headings:font-[family-name:var(--font-article)] prose-headings:font-semibold prose-headings:tracking-[-0.01em]">
            <MDXRemote source={post.content} components={{ YouTubeEmbed, TwitterEmbed }} />
          </div>
        </article>
      </Container>
    </main>
  )
}
