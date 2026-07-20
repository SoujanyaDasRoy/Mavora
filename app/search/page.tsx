import { SearchBox } from '@/components/SearchBox'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'

export default function SearchPage() {
  return (
    <main>
      <Container narrow className="pb-16">
        <PageHeader
          eyebrow="Explore"
          title="Search"
          dek="Find articles across AI, technology, productivity, and business."
        />
        <SearchBox />
      </Container>
    </main>
  )
}
