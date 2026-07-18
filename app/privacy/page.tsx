import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/pages'

export default function PrivacyPage() {
  const page = getPageBySlug('privacy')
  if (!page) notFound()
  return (
    <main>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
    </main>
  )
}
