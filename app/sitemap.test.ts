import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'
import { getAllPosts } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

describe('sitemap', () => {
  it('includes every non-draft post', () => {
    const entries = sitemap()
    const posts = getAllPosts()
    for (const post of posts) {
      const url = `${SITE_URL}/${post.pillar}/${post.slug}/`
      expect(entries.some((e) => e.url === url)).toBe(true)
    }
  })
})
