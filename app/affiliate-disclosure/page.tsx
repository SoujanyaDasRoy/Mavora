import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageBySlug } from '@/lib/pages'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

export function generateMetadata(): Metadata {
  const page = getPageBySlug('affiliate-disclosure')
  if (!page) return {}
  return { title: page.title }
}

export default function AffiliateDisclosurePage() {
  const page = getPageBySlug('affiliate-disclosure')
  if (!page) notFound()
  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Legal"
          title={page.title}
          dek="How we handle links that earn Mavora a commission."
        />
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote source={page.content} />
        </div>
      </Container>
    </main>
  )
}
