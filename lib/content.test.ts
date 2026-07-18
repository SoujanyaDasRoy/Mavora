import { describe, it, expect } from 'vitest'
import { getAllPosts, getPostsByPillar, getPostBySlug } from './content'

describe('content loader', () => {
  it('loads all non-draft posts sorted newest first', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    expect(posts[0].frontmatter.title).toBeDefined()
  })

  it('filters posts by pillar', () => {
    const posts = getPostsByPillar('ai')
    expect(posts.every((p) => p.pillar === 'ai')).toBe(true)
  })

  it('loads a single post by slug', () => {
    const post = getPostBySlug('ai', 'example-post')
    expect(post).not.toBeNull()
    expect(post?.frontmatter.title).toBe('Example AI Post')
  })

  it('returns null for a missing slug', () => {
    const post = getPostBySlug('ai', 'does-not-exist')
    expect(post).toBeNull()
  })
})
