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
import { deleteContentFile } from '@/lib/github'
import { recordAuditEvent } from '@/lib/audit'
import { createDraft } from '@/lib/articles'
import { GET, PATCH, DELETE } from './route'

beforeEach(async () => {
  vi.clearAllMocks()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W1')").run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w2', 'writer', 'W2')").run()
})

describe('GET /api/articles/[id]', () => {
  it('returns the article to its own author', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await GET(new Request('https://x'), { params: Promise.resolve({ id: article.id }) })
    expect(response.status).toBe(200)
  })

  it('returns 403 when a different writer requests it', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await GET(new Request('https://x'), { params: Promise.resolve({ id: article.id }) })
    expect(response.status).toBe(403)
  })
})

describe('PATCH /api/articles/[id]', () => {
  it('updates the article when the caller is the author', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ title: 'Renamed' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(200)
    const body = await response.json() as any
    expect(body.title).toBe('Renamed')
  })

  it('returns 403 when a different writer attempts to update it', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ title: 'Hijacked' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(403)
  })

  it('allows changing pillar on a draft article', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ pillar: 'business' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(200)
    const body = await response.json() as any
    expect(body.pillar).toBe('business')
  })

  it('rejects a pillar change on an already-published article with 400, to avoid orphaning the old MDX file at re-publish', async () => {
    const article = await createDraft(env.DB, { title: 'Live', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("UPDATE articles SET status = 'published' WHERE id = ?").bind(article.id).run()
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ pillar: 'business' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(400)

    // The error message must not imply there's a safe/reversible "unpublish"
    // toggle -- the only way to clear published status is DELETE, which
    // hard-deletes the whole row with no undo. Assert on substance rather
    // than an exact string so wording tweaks don't require a test update.
    const body = (await response.json()) as any
    expect(body.error.toLowerCase()).not.toContain('unpublish')
    expect(body.error.toLowerCase()).toMatch(/no undo|permanent|no way to (undo|recover)/)

    // The pillar in the DB must be unchanged -- confirming the reject
    // happened before any write, not merely that the response was 400.
    const row = await env.DB.prepare('SELECT pillar FROM articles WHERE id = ?').bind(article.id).first()
    expect((row as any).pillar).toBe('ai')
  })

  it('allows a no-op PATCH (same pillar) on an already-published article', async () => {
    const article = await createDraft(env.DB, { title: 'Live', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("UPDATE articles SET status = 'published' WHERE id = ?").bind(article.id).run()
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ pillar: 'ai', title: 'Live, updated' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(200)
  })

  it('records an audit event on update', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ title: 'Renamed' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(200)

    const auditRow = await env.DB.prepare('SELECT * FROM audit_log WHERE article_id = ?')
      .bind(article.id)
      .first()
    expect(auditRow?.actor_id).toBe('w1')
    expect(auditRow?.action).toBe('update')
  })
})

describe('DELETE /api/articles/[id]', () => {
  it('deletes the article when the caller is the author', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)

    const auditRow = await env.DB.prepare('SELECT * FROM audit_log WHERE article_id = ?')
      .bind(article.id)
      .first()
    expect(auditRow?.actor_id).toBe('w1')
    expect(auditRow?.action).toBe('delete')
  })

  it('returns 403 when a different writer attempts to delete it', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(403)
  })

  it('removes the git file when deleting a published article', async () => {
    const article = await createDraft(env.DB, { title: 'Published', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("UPDATE articles SET status = 'published' WHERE id = ?").bind(article.id).run()
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)
    expect(deleteContentFile).toHaveBeenCalledWith('content/posts/ai/published.mdx', expect.stringContaining('published'))
  })

  it('does not touch git when deleting a draft article', async () => {
    const article = await createDraft(env.DB, { title: 'Still a draft', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)
    expect(deleteContentFile).not.toHaveBeenCalled()
  })

  it('deletes the article\'s R2 media objects, leaving other articles\' media untouched', async () => {
    const article = await createDraft(env.DB, { title: 'Has media', pillar: 'ai', authorId: 'w1' })
    const other = await createDraft(env.DB, { title: 'Other', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const bucket = env.MEDIA_BUCKET
    const key1 = `articles/${article.id}/one.webp`
    const key2 = `articles/${article.id}/two.webp`
    const keptKey = `articles/${other.id}/kept.webp`
    await bucket.put(key1, new Uint8Array([1]))
    await bucket.put(key2, new Uint8Array([1]))
    await bucket.put(keptKey, new Uint8Array([1]))
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', ?, ?, '')")
      .bind(article.id, key1)
      .run()
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m2', ?, ?, '')")
      .bind(article.id, key2)
      .run()
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m3', ?, ?, '')")
      .bind(other.id, keptKey)
      .run()

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)

    expect(await bucket.get(key1)).toBeNull()
    expect(await bucket.get(key2)).toBeNull()
    expect(await bucket.get(keptKey)).not.toBeNull()
  })

  it('still returns 204 when recordAuditEvent fails', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    ;(recordAuditEvent as any).mockRejectedValueOnce(new Error('audit write failed'))

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)
  })
})
