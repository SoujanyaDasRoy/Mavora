import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/pages'

export default function EditorialStandardsPage() {
  const page = getPageBySlug('editorial-standards')
  if (!page) notFound()
  return (
    <main>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
    </main>
  )
}
