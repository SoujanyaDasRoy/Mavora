import { SearchBox } from '@/components/SearchBox'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-static'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const initialQuery = q ?? ''

  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Explore"
          title="Search"
          dek="Find articles across AI, technology, productivity, and business."
        />
        <SearchBox query={initialQuery} />
      </Container>
    </main>
  )
}
