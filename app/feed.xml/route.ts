import { getAllPosts } from '@/lib/content'
import { buildFeedXml } from '@/lib/feed'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts()
  const xml = buildFeedXml(posts)
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
