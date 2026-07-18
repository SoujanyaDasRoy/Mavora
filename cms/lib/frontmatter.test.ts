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

  it('escapes literal backslashes in the title before escaping quotes, producing valid YAML', () => {
    // A title containing a literal backslash followed by a quote is the
    // case that breaks if backslashes aren't escaped first: naive
    // quote-only escaping turns `\"` into `\\"` which YAML reads as an
    // escaped backslash immediately followed by an unescaped, string-
    // terminating quote.
    const yaml = buildFrontmatter({ ...baseArticle, seoTitle: 'C:\\Users\\writer "notes"' })
    expect(yaml).toContain('title: "C:\\\\Users\\\\writer \\"notes\\""')
  })

  it('escapes literal backslashes in the seoDescription', () => {
    const yaml = buildFrontmatter({ ...baseArticle, seoDescription: 'Path is C:\\temp\\file, see docs.' })
    expect(yaml).toContain('description: "Path is C:\\\\temp\\\\file, see docs."')
  })
})
