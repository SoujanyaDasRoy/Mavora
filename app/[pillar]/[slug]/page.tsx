import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { PILLARS, type Pillar, getAllPosts, getPostBySlug } from '@/lib/content'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { TwitterEmbed } from '@/components/TwitterEmbed'

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
  return (
    <main>
      {post.frontmatter.ogImage && (
        <img
          src={post.frontmatter.ogImage}
          alt=""
          className="w-full aspect-[21/9] object-cover"
        />
      )}
      <article className="mx-auto max-w-[720px] px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] mb-2">
          {post.pillar}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">{post.frontmatter.title}</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mb-8">{post.frontmatter.publishedAt}</p>
        <div className="prose dark:prose-invert max-w-none prose-a:text-[var(--color-accent)]">
          <MDXRemote source={post.content} components={{ YouTubeEmbed, TwitterEmbed }} />
        </div>
      </article>
    </main>
  )
}
