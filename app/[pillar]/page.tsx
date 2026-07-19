import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostsByPillar } from '@/lib/content'
import { PILLARS, PILLAR_LABELS, type Pillar } from '@/lib/pillars'
import { ArticleCard } from '@/components/ArticleCard'

// Disable dynamic params so unknown slugs get a 404 (required with output:'export')
export const dynamicParams = false

// Import PILLARS from the client-safe pillars.ts (no node:fs) so that
// Next.js static-export validation can resolve params at build time.
export async function generateStaticParams() {
  return PILLARS.map((pillar) => ({ pillar }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pillar: string }>
}): Promise<Metadata> {
  const { pillar: pillarParam } = await params
  if (!PILLARS.includes(pillarParam as Pillar)) return {}
  const label = PILLAR_LABELS[pillarParam as Pillar] ?? pillarParam
  return {
    title: `${label} Articles`,
    description: `Practical, actionable ${label} articles from Mavora.`,
  }
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
