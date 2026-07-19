import { getSearchIndex } from '@/lib/search-index'

export const dynamic = 'force-static'

export function GET() {
  return new Response(JSON.stringify(getSearchIndex()), {
    headers: { 'Content-Type': 'application/json' },
  })
}
