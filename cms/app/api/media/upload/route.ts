import { auth } from '@clerk/nextjs/server'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById } from '@/lib/articles'
import { validateUpload, uploadToR2, recordMedia } from '@/lib/media'

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const form = await request.formData()
  const articleId = form.get('articleId')
  const altText = form.get('altText')
  const file = form.get('file')

  if (typeof articleId !== 'string' || typeof altText !== 'string' || !(file instanceof File)) {
    return new Response('Invalid form data', { status: 400 })
  }

  const article = await getArticleById(db, articleId)
  if (!article) return new Response('Article not found', { status: 404 })
  if (writer.role !== 'admin' && article.authorId !== userId) {
    return new Response('Forbidden', { status: 403 })
  }

  const existingCount = await db
    .prepare('SELECT COUNT(*) as c FROM media WHERE article_id = ?')
    .bind(articleId)
    .first<{ c: number }>()

  const validation = validateUpload({ type: file.type, size: file.size }, existingCount?.c ?? 0)
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400 })
  }

  const extension = file.type.split('/')[1]
  const key = `articles/${articleId}/${crypto.randomUUID()}.${extension}`
  const bytes = await file.arrayBuffer()

  await uploadToR2(getMediaBucket(), key, bytes, file.type)
  const media = await recordMedia(db, articleId, key, altText)

  return new Response(JSON.stringify(media), { status: 201 })
}
