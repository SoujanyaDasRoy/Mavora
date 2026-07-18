import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById } from '@/lib/articles'
import { blockNoteToMdx } from '@/lib/mdx-convert'
import { buildFrontmatter } from '@/lib/frontmatter'
import { commitContentFile } from '@/lib/github'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const article = await getArticleById(db, id)
  if (!article) return new Response('Not found', { status: 404 })
  if (writer.role !== 'admin' && article.authorId !== userId) {
    return new Response('Forbidden', { status: 403 })
  }

  let frontmatter: string
  try {
    frontmatter = buildFrontmatter({ ...article, publishedAt: article.publishedAt ?? new Date().toISOString() })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 400 })
  }

  const body = blockNoteToMdx(JSON.parse(article.blocknoteContent))
  const mdx = `${frontmatter}\n${body}\n`
  const path = `content/posts/${article.pillar}/${article.slug}.mdx`

  await commitContentFile(path, mdx, `publish: ${article.slug}`)

  await db
    .prepare("UPDATE articles SET status = 'published', published_at = COALESCE(published_at, datetime('now')) WHERE id = ?")
    .bind(id)
    .run()

  return new Response(JSON.stringify({ published: true, path }), { status: 200 })
}
