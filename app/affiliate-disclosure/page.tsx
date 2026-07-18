import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageBySlug } from '@/lib/pages'

export default function AffiliateDisclosurePage() {
  const page = getPageBySlug('affiliate-disclosure')
  if (!page) notFound()
  return (
    <main>
      <h1>{page.title}</h1>
      <div>
        <MDXRemote source={page.content} />
      </div>
    </main>
  )
}
