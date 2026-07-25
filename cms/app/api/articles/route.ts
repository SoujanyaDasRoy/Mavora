import { z } from 'zod'
import { getOrCreateCurrentWriter } from '@/lib/auth-writer'
import { getDb } from '@/lib/cloudflare'
import { createDraft, listArticles } from '@/lib/articles'
import { recordAuditEvent } from '@/lib/audit'

const createSchema = z.object({
  title: z.string().min(1),
  pillar: z.enum(['ai', 'technology', 'productivity', 'business']),
})

export async function GET(_request: Request): Promise<Response> {
  const db = getDb()
  const writer = await getOrCreateCurrentWriter(db)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const articles = await listArticles(db, writer.role === 'admin' ? {} : { authorId: writer.id })
  return new Response(JSON.stringify(articles), { status: 200 })
}

export async function POST(request: Request): Promise<Response> {
  const db = getDb()
  const writer = await getOrCreateCurrentWriter(db)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const article = await createDraft(db, { ...parsed.data, authorId: writer.id })

  try {
    await recordAuditEvent(db, { actorId: writer.id, action: 'create', articleId: article.id })
  } catch (error) {
    console.error('Failed to record audit event for article create', error)
  }

  return new Response(JSON.stringify(article), { status: 201 })
}
