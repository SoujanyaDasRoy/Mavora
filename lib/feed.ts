import type { Post } from './content'
import { SITE_URL } from './site'

// Escapes text for safe inclusion in XML element content/attributes (used by app/feed.xml).
// '&' MUST be escaped first -- otherwise the '&' introduced while escaping '<', '>', '"',
// or "'" below would itself get re-escaped into '&amp;amp;...'.
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Builds the RSS 2.0 XML document served by app/feed.xml/route.ts. Pulled out into its
// own pure function (instead of living inline in the route) so it can be unit-tested
// with synthetic posts, without touching the filesystem-backed content loader.
export function buildFeedXml(posts: Post[]): string {
  const items = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <link>${SITE_URL}/${escapeXml(post.pillar)}/${escapeXml(post.slug)}/</link>
      <description>${escapeXml(post.frontmatter.description)}</description>
      <pubDate>${new Date(post.frontmatter.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Mavora</title>
  <link>${SITE_URL}/</link>
  <description>Technology, AI, productivity and business, explained practically.</description>
  ${items}
</channel></rss>`
}
