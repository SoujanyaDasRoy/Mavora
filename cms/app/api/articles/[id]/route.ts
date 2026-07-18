import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById, updateArticle, deleteArticleRow, type Article } from '@/lib/articles'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  pillar: z.enum(['ai', 'technology', 'productivity', 'business']).optional(),
  blocknoteContent: z.string().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
})

// Explicit return type is required here: without it, TS's inferred return
// type for this async function (with its several early-return branches of
// differing object shapes) spuriously widens the narrowed `error` property
// to `Response | undefined` at call sites using `'error' in result`.
async function authorizeAccess(
  id: string
): Promise<{ error: Response } | { db: D1Database; article: Article }> {
  const { userId } = await auth()
  if (!userId) return { error: new Response('Unauthorized', { status: 401 }) } as const

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return { error: new Response('Forbidden', { status: 403 }) } as const

  const article = await getArticleById(db, id)
  if (!article) return { error: new Response('Not found', { status: 404 }) } as const

  if (writer.role !== 'admin' && article.authorId !== userId) {
    return { error: new Response('Forbidden', { status: 403 }) } as const
  }

  return { db, article } as const
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error
  return new Response(JSON.stringify(result.article), { status: 200 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const updated = await updateArticle(result.db, id, parsed.data)
  return new Response(JSON.stringify(updated), { status: 200 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error

  await deleteArticleRow(result.db, id)
  return new Response(null, { status: 204 })
}
