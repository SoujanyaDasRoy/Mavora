import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
import { createDraft, getArticleById } from '@/lib/articles'
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

  // Fix round 2, Finding 2: replacing a cover image previously left the OLD
  // cover's `media` row/R2 object orphaned forever (only the weekly cleanup
  // cron would eventually catch it), permanently eating into
  // MAX_MEDIA_PER_ARTICLE (lib/media.ts) with media nothing references
  // anymore. PATCHing `coverImage` to a new value must now delete the
  // PREVIOUS cover's row and R2 object.
  describe('cover image replacement cleanup', () => {
    const originalBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL

    beforeEach(() => {
      process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    })

    afterEach(async () => {
      if (originalBase === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
      else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = originalBase
      await env.DB.prepare('DELETE FROM media').run()
    })

    async function patchCoverImage(articleId: string, r2Key: string) {
      const bucket = env.MEDIA_BUCKET
      await bucket.put(r2Key, new Uint8Array([1]))
      await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES (?, ?, ?, '')")
        .bind(crypto.randomUUID(), articleId, r2Key)
        .run()
      const publicUrl = `https://media.example.com/${r2Key}`
      const response = await PATCH(
        new Request('https://x', { method: 'PATCH', body: JSON.stringify({ coverImage: publicUrl }) }),
        { params: Promise.resolve({ id: articleId }) }
      )
      expect(response.status).toBe(200)
      return { r2Key, publicUrl }
    }

    it('deletes the OLD cover R2 object and media row when a new cover replaces it, keeping the new one intact', async () => {
      const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
      ;(auth as any).mockResolvedValue({ userId: 'w1' })

      const first = await patchCoverImage(article.id, `articles/${article.id}/cover-1.webp`)
      const second = await patchCoverImage(article.id, `articles/${article.id}/cover-2.webp`)

      const bucket = env.MEDIA_BUCKET
      expect(await bucket.get(first.r2Key)).toBeNull()
      expect(await bucket.get(second.r2Key)).not.toBeNull()

      const rows = (
        await env.DB.prepare('SELECT r2_key FROM media WHERE article_id = ?').bind(article.id).all()
      ).results as { r2_key: string }[]
      expect(rows.map((r) => r.r2_key)).toEqual([second.r2Key])
    })

    it('does not grow the media count unboundedly across repeated cover replacements', async () => {
      const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
      ;(auth as any).mockResolvedValue({ userId: 'w1' })

      await patchCoverImage(article.id, `articles/${article.id}/cover-1.webp`)
      await patchCoverImage(article.id, `articles/${article.id}/cover-2.webp`)
      await patchCoverImage(article.id, `articles/${article.id}/cover-3.webp`)

      const count = await env.DB.prepare('SELECT COUNT(*) as c FROM media WHERE article_id = ?')
        .bind(article.id)
        .first<{ c: number }>()
      expect(count?.c).toBe(1)
    })

    it('does nothing when the article had no previous cover image', async () => {
      const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
      ;(auth as any).mockResolvedValue({ userId: 'w1' })

      await patchCoverImage(article.id, `articles/${article.id}/cover-1.webp`)

      const count = await env.DB.prepare('SELECT COUNT(*) as c FROM media WHERE article_id = ?')
        .bind(article.id)
        .first<{ c: number }>()
      expect(count?.c).toBe(1)
    })
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

  // Real bug (fix batch 4, issue 1): deleteMediaObjects previously had no
  // internal error handling, so an R2 outage on any one object's delete
  // would throw uncaught out of the DELETE handler -- aborting it AFTER
  // deleteContentFile (git) already ran but BEFORE deleteArticleRow (D1)
  // ever got a chance to. That leaves a published article's MDX file gone
  // from git while D1 still shows it live -- a desync with no automatic
  // recovery path. This proves the fix: deleteArticleRow (and the audit
  // log, and the 204 response) all still happen even when one R2 delete
  // fails, and the article's `media` rows are still cleaned up via the
  // articles->media ON DELETE CASCADE (so the surviving orphaned R2 object
  // has no matching `media` row and will be reclaimed by the weekly
  // cleanupOrphanedMedia cron).
  it('still deletes the article row and returns 204 when an R2 delete fails for one media object', async () => {
    const article = await createDraft(env.DB, { title: 'Has media', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const bucket = env.MEDIA_BUCKET
    const key1 = `articles/${article.id}/one.webp`
    const key2 = `articles/${article.id}/two.webp`
    await bucket.put(key1, new Uint8Array([1]))
    await bucket.put(key2, new Uint8Array([1]))
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', ?, ?, '')")
      .bind(article.id, key1)
      .run()
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m2', ?, ?, '')")
      .bind(article.id, key2)
      .run()

    const realDelete = bucket.delete.bind(bucket)
    const deleteSpy = vi.spyOn(bucket, 'delete').mockImplementation(async (keys: string | string[]) => {
      if (keys === key1) throw new Error('simulated R2 outage')
      return realDelete(keys as string)
    })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)

    // D1 cleanup completed despite the R2 failure: the article row and (via
    // CASCADE) its media rows are gone, even for the object whose R2 delete
    // failed.
    expect(await getArticleById(env.DB, article.id)).toBeNull()
    const mediaRows = await env.DB.prepare('SELECT id FROM media WHERE article_id = ?').bind(article.id).all()
    expect(mediaRows.results).toHaveLength(0)

    deleteSpy.mockRestore()
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
