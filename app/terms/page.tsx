import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageBySlug } from '@/lib/pages'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

export function generateMetadata(): Metadata {
  const page = getPageBySlug('terms')
  if (!page) return {}
  return { title: page.title }
}

export default function TermsPage() {
  const page = getPageBySlug('terms')
  if (!page) notFound()
  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Legal"
          title={page.title}
          dek="The rules for using Mavora's content and site."
        />
        <div className="prose dark:prose-invert max-w-none">
          <MDXRemote source={page.content} />
        </div>
      </Container>
    </main>
  )
}
