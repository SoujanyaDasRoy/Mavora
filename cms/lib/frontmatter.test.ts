import { describe, it, expect } from 'vitest'
import { buildFrontmatter } from './frontmatter'
import type { Article } from './articles'

const baseArticle: Article = {
  id: 'a1',
  title: 'My Post',
  slug: 'my-post',
  pillar: 'ai',
  status: 'draft',
  blocknoteContent: '[]',
  seoTitle: 'My Post — SEO Title',
  seoDescription: 'A short description under 160 chars.',
  coverImage: 'articles/a1/cover.webp',
  authorId: 'w1',
  createdAt: '2026-07-18T00:00:00Z',
  updatedAt: '2026-07-18T00:00:00Z',
  publishedAt: null,
}

describe('buildFrontmatter', () => {
  it('produces YAML frontmatter matching the public site schema', () => {
    const yaml = buildFrontmatter(baseArticle)
    expect(yaml).toContain('title: "My Post — SEO Title"')
    expect(yaml).toContain('description: "A short description under 160 chars."')
    expect(yaml).toContain('pillar: "ai"')
    expect(yaml).toContain('draft: false')
    expect(yaml).toMatch(/publishedAt: "\d{4}-\d{2}-\d{2}"/)
  })

  it('falls back to the article title when seoTitle is not set', () => {
    const yaml = buildFrontmatter({ ...baseArticle, seoTitle: null })
    expect(yaml).toContain('title: "My Post"')
  })

  it('throws if seoDescription is missing, since the public site requires it', () => {
    expect(() => buildFrontmatter({ ...baseArticle, seoDescription: null })).toThrow(/description/i)
  })

  it('throws if seoDescription exceeds the public site schema\'s 160-char limit', () => {
    const tooLong = 'x'.repeat(161)
    expect(() => buildFrontmatter({ ...baseArticle, seoDescription: tooLong })).toThrow(/160/)
  })
})
