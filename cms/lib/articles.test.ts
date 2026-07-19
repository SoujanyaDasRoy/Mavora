import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { createDraft, getArticleById, listArticles, updateArticle, deleteArticleRow, slugify } from './articles'

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

// Real bug: createDraft generated a slug via slugify(title) with no
// collision check, but articles.slug has a UNIQUE constraint (see
// migrations/0001_init.sql). Two articles with the same (or
// slugify-equivalent) title threw an unhandled D1 "UNIQUE constraint
// failed" error, surfacing as an uncaught 500 to the writer.
describe('createDraft slug collisions', () => {
  it('disambiguates the slug with a numeric suffix when one with the same title already exists', async () => {
    const first = await createDraft(env.DB, { title: 'Same Title', pillar: 'ai', authorId: 'author_1' })
    const second = await createDraft(env.DB, { title: 'Same Title', pillar: 'ai', authorId: 'author_1' })

    expect(first.slug).toBe('same-title')
    expect(second.slug).toBe('same-title-2')
    expect(second.id).not.toBe(first.id)

    // Both rows actually persisted -- no uncaught D1 error for either.
    expect(await getArticleById(env.DB, first.id)).not.toBeNull()
    expect(await getArticleById(env.DB, second.id)).not.toBeNull()
  })

  it('keeps disambiguating across more than two collisions', async () => {
    const one = await createDraft(env.DB, { title: 'Dup', pillar: 'ai', authorId: 'author_1' })
    const two = await createDraft(env.DB, { title: 'Dup', pillar: 'ai', authorId: 'author_1' })
    const three = await createDraft(env.DB, { title: 'Dup', pillar: 'ai', authorId: 'author_1' })

    expect([one.slug, two.slug, three.slug]).toEqual(['dup', 'dup-2', 'dup-3'])
  })

  it('throws a clear, catchable error when retries are exhausted instead of hitting a raw D1 error', async () => {
    const base = 'exhausted'
    await env.DB.prepare(
      "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('seed-1', 'Exhausted', ?, 'ai', 'draft', '[]', 'author_1')"
    ).bind(base).run()
    for (let i = 2; i <= 20; i++) {
      await env.DB.prepare(
        "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES (?, 'Exhausted', ?, 'ai', 'draft', '[]', 'author_1')"
      ).bind(`seed-${i}`, `${base}-${i}`).run()
    }

    await expect(
      createDraft(env.DB, { title: 'Exhausted', pillar: 'ai', authorId: 'author_1' })
    ).rejects.toThrow(/unique slug/i)
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

describe('deleteArticleRow', () => {
  it('removes the article row', async () => {
    const article = await createDraft(env.DB, { title: 'To delete', pillar: 'ai', authorId: 'author_1' })
    await deleteArticleRow(env.DB, article.id)
    expect(await getArticleById(env.DB, article.id)).toBeNull()
  })
})
