import { requireRole } from '@/lib/role'
import { getDb } from '@/lib/cloudflare'
import { listMedia } from '@/lib/media'

export async function GET(_request: Request): Promise<Response> {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) return guard

  const db = getDb()
  const items = await listMedia(db, {
    isAdmin: guard.writer.role === 'admin',
    authorId: guard.writer.id,
  })

  return new Response(JSON.stringify(items), { status: 200 })
}