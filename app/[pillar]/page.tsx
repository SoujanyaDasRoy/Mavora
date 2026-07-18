import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PILLARS, Pillar, getPostsByPillar } from '@/lib/content'

export function generateStaticParams() {
  return PILLARS.map((pillar) => ({ pillar }))
}

export default async function PillarPage({
  params,
}: {
  params: Promise<{ pillar: string }>
}) {
  const { pillar: pillarParam } = await params
  if (!PILLARS.includes(pillarParam as Pillar)) notFound()
  const pillar = pillarParam as Pillar
  const posts = getPostsByPillar(pillar)
  return (
    <main>
      <h1>{pillar}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/${pillar}/${post.slug}`}>{post.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
