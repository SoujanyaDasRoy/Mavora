import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/github', () => ({
  commitContentFile: vi.fn().mockResolvedValue(undefined),
  deleteContentFile: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/audit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/audit')>('@/lib/audit')
  return { ...actual, recordAuditEvent: vi.fn(actual.recordAuditEvent) }
})

import { auth } from '@clerk/nextjs/server'
import { commitContentFile } from '@/lib/github'
import { recordAuditEvent } from '@/lib/audit'
import { createDraft, updateArticle, getArticleById } from '@/lib/articles'
import { POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
})

describe('POST /api/articles/[id]/publish', () => {
  it('commits the MDX file and marks the article published', async () => {
    const article = await createDraft(env.DB, { title: 'My Post', pillar: 'ai', authorId: 'w1' })
    await updateArticle(env.DB, article.id, { seoDescription: 'A description.' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })

    expect(response.status).toBe(200)
    expect(commitContentFile).toHaveBeenCalledWith(
      'content/posts/ai/my-post.mdx',
      expect.any(String),
      expect.stringContaining('my-post')
    )

    const updated = await getArticleById(env.DB, article.id)
    expect(updated?.status).toBe('published')
    expect(updated?.publishedAt).not.toBeNull()

    const auditRow = await env.DB.prepare('SELECT * FROM audit_log WHERE article_id = ?')
      .bind(article.id)
      .first()
    expect(auditRow?.actor_id).toBe('w1')
    expect(auditRow?.action).toBe('publish')
  })

  it('returns 400 when seoDescription is missing', async () => {
    const article = await createDraft(env.DB, { title: 'No SEO', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(400)
  })

  it('returns 403 when the caller is not the article\'s author', async () => {
    const article = await createDraft(env.DB, { title: 'Not mine', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w2', 'writer', 'W2')").run()
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(403)
  })

  it('still returns 200 when recordAuditEvent fails', async () => {
    const article = await createDraft(env.DB, { title: 'Still publishes', pillar: 'ai', authorId: 'w1' })
    await updateArticle(env.DB, article.id, { seoDescription: 'A description.' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    ;(recordAuditEvent as any).mockRejectedValueOnce(new Error('audit write failed'))

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(200)

    const updated = await getArticleById(env.DB, article.id)
    expect(updated?.status).toBe('published')
  })
})
