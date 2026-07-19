import { SearchBox } from '@/components/SearchBox'

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-8">Search</h1>
      <SearchBox />
    </main>
  )
}
