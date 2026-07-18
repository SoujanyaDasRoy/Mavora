import { auth } from '@clerk/nextjs/server'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { listArticles } from '@/lib/articles'
import { getR2UsedBytes, R2_FREE_TIER_BYTES, getSubscriberCount, getPageViews30d } from '@/lib/stats'

export async function GET(): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const articles = await listArticles(db, writer.role === 'admin' ? {} : { authorId: userId })
  const draftCount = articles.filter((a) => a.status === 'draft').length
  const publishedCount = articles.filter((a) => a.status === 'published').length
  const [r2UsedBytes, subscriberCount, pageViews30d] = await Promise.all([
    getR2UsedBytes(getMediaBucket()),
    getSubscriberCount(),
    getPageViews30d(),
  ])

  return new Response(
    JSON.stringify({
      draftCount,
      publishedCount,
      r2UsedBytes,
      r2FreeTierBytes: R2_FREE_TIER_BYTES,
      subscriberCount,
      pageViews30d,
    }),
    { status: 200 }
  )
}
