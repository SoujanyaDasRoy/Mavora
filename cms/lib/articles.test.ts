import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { createDraft, getArticleById, listArticles, updateArticle, slugify } from './articles'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('author_1', 'writer', 'A')").run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('author_2', 'writer', 'B')").run()
})

describe('slugify', () => {
  it('lowercases and hyphenates a title', () => {
    expect(slugify('Apple Unveils M4 MacBook Air')).toBe('apple-unveils-m4-macbook-air')
  })
})

describe('createDraft', () => {
  it('creates a draft article with a generated slug', async () => {
    const article = await createDraft(env.DB, { title: 'My First Post', pillar: 'ai', authorId: 'author_1' })
    expect(article.status).toBe('draft')
    expect(article.slug).toBe('my-first-post')
    expect(article.authorId).toBe('author_1')
    expect(article.blocknoteContent).toBe('[]')
  })
})

describe('getArticleById / listArticles', () => {
  it('returns null for a missing article', async () => {
    expect(await getArticleById(env.DB, 'nonexistent')).toBeNull()
  })

  it('lists only the given author\'s articles when authorId filter is set', async () => {
    await createDraft(env.DB, { title: 'Post A', pillar: 'ai', authorId: 'author_1' })
    await createDraft(env.DB, { title: 'Post B', pillar: 'technology', authorId: 'author_2' })

    const mine = await listArticles(env.DB, { authorId: 'author_1' })
    expect(mine).toHaveLength(1)
    expect(mine[0].title).toBe('Post A')

    const all = await listArticles(env.DB, {})
    expect(all).toHaveLength(2)
  })
})

describe('updateArticle', () => {
  it('updates title and blocknoteContent, bumping updatedAt', async () => {
    const article = await createDraft(env.DB, { title: 'Draft', pillar: 'business', authorId: 'author_1' })
    const updated = await updateArticle(env.DB, article.id, {
      title: 'Updated Title',
      blocknoteContent: '[{"type":"paragraph"}]',
    })
    expect(updated.title).toBe('Updated Title')
    expect(updated.blocknoteContent).toBe('[{"type":"paragraph"}]')
    expect(updated.updatedAt).not.toBe(article.updatedAt)
  })
})
