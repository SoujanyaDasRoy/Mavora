import { requireRole } from '@/lib/role'
import { getDb } from '@/lib/cloudflare'
import { listWritersWithCounts, type WriterWithCounts } from '@/lib/writers'

/**
 * GET /api/writers
 *
 * Admin-only: returns every writer with their article counts. The UI on
 * /writers uses the per-row publishedCount to highlight the most active
 * contributors, and the articleCount to show drafts in flight.
 */
export async function GET(_request: Request): Promise<Response> {
  const guard = await requireRole(['admin'])
  if (guard instanceof Response) return guard

  const db = getDb()
  const items: WriterWithCounts[] = await listWritersWithCounts(db)
  return new Response(JSON.stringify(items), { status: 200 })
}