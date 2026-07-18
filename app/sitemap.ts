import type { MetadataRoute } from 'next'
import { getAllPosts, PILLARS } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const postEntries = posts.map((post) => ({
    url: `${SITE_URL}/${post.pillar}/${post.slug}/`,
    lastModified: post.frontmatter.publishedAt,
  }))
  const pillarEntries = PILLARS.map((pillar) => ({
    url: `${SITE_URL}/${pillar}/`,
  }))
  return [{ url: `${SITE_URL}/` }, ...pillarEntries, ...postEntries]
}
