import { getAllPosts } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts()
  const items = posts
    .map(
      (post) => `
    <item>
      <title>${post.frontmatter.title}</title>
      <link>${SITE_URL}/${post.pillar}/${post.slug}/</link>
      <description>${post.frontmatter.description}</description>
      <pubDate>${new Date(post.frontmatter.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Mavora</title>
  <link>${SITE_URL}/</link>
  <description>Technology, AI, productivity and business, explained practically.</description>
  ${items}
</channel></rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
