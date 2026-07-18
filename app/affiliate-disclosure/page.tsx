import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/pages'

export default function AffiliateDisclosurePage() {
  const page = getPageBySlug('affiliate-disclosure')
  if (!page) notFound()
  return (
    <main>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
    </main>
  )
}
