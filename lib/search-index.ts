import { getAllPosts } from './content'

export interface SearchEntry {
  title: string
  description: string
  pillar: string
  slug: string
  publishedAt: string
}

export function getSearchIndex(): SearchEntry[] {
  return getAllPosts().map((post) => ({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    pillar: post.pillar,
    slug: post.slug,
    publishedAt: post.frontmatter.publishedAt,
  }))
}
