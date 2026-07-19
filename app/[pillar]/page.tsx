import { notFound } from 'next/navigation'
import { PILLARS, Pillar, getPostsByPillar } from '@/lib/content'
import { PILLAR_LABELS } from '@/lib/pillars'
import { ArticleCard } from '@/components/ArticleCard'

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
    <main className="mx-auto max-w-[1280px] px-6 md:px-8 py-10">
      <h1 className="text-3xl font-extrabold mb-8">{PILLAR_LABELS[pillar] ?? pillar}</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} variant="grid" />
        ))}
      </div>
    </main>
  )
}
