import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageBySlug } from '@/lib/pages'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

export function generateMetadata(): Metadata {
  const page = getPageBySlug('about')
  if (!page) return {}
  return { title: page.title }
}

export default function AboutPage() {
  const page = getPageBySlug('about')
  if (!page) notFound()
  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Company"
          title={page.title}
          dek="Who we are, what we cover, and why we write for the ambitious."
        />
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote source={page.content} />
        </div>
      </Container>
    </main>
  )
}
