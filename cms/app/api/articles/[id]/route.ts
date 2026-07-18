import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById, updateArticle, deleteArticleRow, type Article } from '@/lib/articles'
import { deleteContentFile } from '@/lib/github'

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
): Promise<{ error: Response } | { db: D1Database; article: Article; userId: string }> {
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

  return { db, article, userId } as const
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

  // Changing `pillar` on an already-published article would make the next
  // publish commit to a NEW `content/posts/<newPillar>/<slug>.mdx` path
  // without ever deleting the OLD path's file -- a permanent orphaned
  // duplicate left live on the public site. `slug` is immutable so this
  // can't happen via slug changes, but pillar has no such guard. Rather
  // than adding a schema column to track "the pillar last published under"
  // just to support deleting the old path, we reject the change outright:
  // the writer must unpublish (DELETE, which removes the live file) before
  // moving an already-published article to a different pillar.
  if (
    result.article.status === 'published' &&
    parsed.data.pillar !== undefined &&
    parsed.data.pillar !== result.article.pillar
  ) {
    return new Response(
      JSON.stringify({
        error: 'Cannot change pillar on a published article: unpublish it first to avoid orphaning the old file.',
      }),
      { status: 400 }
    )
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

  if (result.article.status === 'published') {
    const path = `content/posts/${result.article.pillar}/${result.article.slug}.mdx`
    await deleteContentFile(path, `unpublish: ${result.article.slug}`)
  }

  await deleteArticleRow(result.db, id)
  return new Response(null, { status: 204 })
}
