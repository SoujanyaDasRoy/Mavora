import { getAllPosts } from './content'

export interface SearchEntry {
  title: string
  description: string
  pillar: string
  slug: string
  publishedAt: string
  readingTime: number
}

export function getSearchIndex(): SearchEntry[] {
  return getAllPosts().map((post) => {
    const wordCount = post.content.trim().split(/\s+/).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))
    return {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      pillar: post.pillar,
      slug: post.slug,
      publishedAt: post.frontmatter.publishedAt,
      readingTime,
    }
  })
}
