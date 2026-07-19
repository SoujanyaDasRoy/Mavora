import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { PILLARS, Pillar, getAllPosts, getPostBySlug } from '@/lib/content'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ pillar: post.pillar, slug: post.slug }))
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
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  )
}
