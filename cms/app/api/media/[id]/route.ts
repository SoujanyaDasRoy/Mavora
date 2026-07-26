import { requireRole } from '@/lib/role'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { deleteMediaById } from '@/lib/media'

/**
 * DELETE /api/media/[id]
 *
 * Removes a media row and its R2 object. Authorization mirrors the upload
 * route (app/api/media/upload/route.ts): admins can delete any media;
 * writers can only delete media attached to articles they authored. We
 * load the owning article once to make the ownership check, rather than
 * denormalizing `author_id` onto `media`.
 */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) return guard

  const { id } = await ctx.params
  if (!id) return new Response('Bad Request', { status: 400 })

  const db = getDb()

  // Ownership check: fetch the owning article's author. Writers who don't
  // own the parent article (and aren't admins) get a 403; admins skip
  // straight through. A missing media row returns 404.
  const row = await db
    .prepare(
      `SELECT media.id AS id, articles.author_id AS author_id
         FROM media
         LEFT JOIN articles ON articles.id = media.article_id
         WHERE media.id = ?`
    )
    .bind(id)
    .first<{ id: string; author_id: string | null }>()

  if (!row) return new Response('Not Found', { status: 404 })
  if (guard.writer.role !== 'admin' && row.author_id !== guard.writer.id) {
    return new Response('Forbidden', { status: 403 })
  }

  const deleted = await deleteMediaById(db, getMediaBucket(), id)
  if (!deleted) return new Response('Not Found', { status: 404 })

  return new Response(null, { status: 204 })
}