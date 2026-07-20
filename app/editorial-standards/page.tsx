import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageBySlug } from '@/lib/pages'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

export function generateMetadata(): Metadata {
  const page = getPageBySlug('editorial-standards')
  if (!page) return {}
  return { title: page.title }
}

export default function EditorialStandardsPage() {
  const page = getPageBySlug('editorial-standards')
  if (!page) notFound()
  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Company"
          title={page.title}
          dek="How every Mavora article gets researched, fact-checked, and corrected."
        />
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote source={page.content} />
        </div>
      </Container>
    </main>
  )
}
