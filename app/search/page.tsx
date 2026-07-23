import { Suspense } from 'react'
import { Container } from '@/components/Container'
import { SearchPageClient } from '@/components/SearchPageClient'
import { getAllPosts } from '@/lib/content'

export const dynamic = 'force-static'

export default function SearchPage() {
  const posts = getAllPosts()

  return (
    <main>
      <Container narrow={false} className="py-12">
        <Suspense fallback={<p className="text-center py-12">Loading search...</p>}>
          <SearchPageClient posts={posts} />
        </Suspense>
      </Container>
    </main>
  )
}
