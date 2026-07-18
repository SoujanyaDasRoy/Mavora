import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { createDraft, listArticles } from '@/lib/articles'

const createSchema = z.object({
  title: z.string().min(1),
  pillar: z.enum(['ai', 'technology', 'productivity', 'business']),
})

export async function GET(_request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const articles = await listArticles(db, writer.role === 'admin' ? {} : { authorId: userId })
  return new Response(JSON.stringify(articles), { status: 200 })
}

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const article = await createDraft(db, { ...parsed.data, authorId: userId })
  return new Response(JSON.stringify(article), { status: 201 })
}
