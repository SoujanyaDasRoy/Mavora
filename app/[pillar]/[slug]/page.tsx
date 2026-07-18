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
    <article>
      <h1>{post.frontmatter.title}</h1>
      <p>{post.frontmatter.description}</p>
      <div>
        <MDXRemote source={post.content} />
      </div>
    </article>
  )
}
