import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { GET } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM media').run()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  // R2 has no bulk-delete-all; clear out anything a previous test left
  // behind so each test starts from an empty bucket (mirrors
  // lib/stats.test.ts's beforeEach).
  const existing = await env.MEDIA_BUCKET.list()
  for (const obj of existing.objects) {
    await env.MEDIA_BUCKET.delete(obj.key)
  }
})

describe('GET /api/cron/cleanup-media', () => {
  // The route calls `cleanupOrphanedMedia` with no `gracePeriodMs` override,
  // so it runs with the real production default (~15 minutes -- see
  // lib/media-cleanup.ts's `DEFAULT_GRACE_PERIOD_MS`). An object created
  // moments ago by this test's own `bucket.put()` is therefore well within
  // the grace period and must survive even though it has no matching `media`
  // row -- this is the TOCTOU-race protection (Task 17) working end-to-end
  // through the real route, not a gap in coverage. The millisecond-scale
  // "old orphan actually gets deleted" case is covered at the unit level in
  // lib/media-cleanup.test.ts, which overrides `gracePeriodMs` to avoid a
  // real 15-minute sleep in the test suite.
  it('keeps a just-uploaded object with no matching media row (grace period) and keeps one that has a row', async () => {
    const bucket = env.MEDIA_BUCKET
    await bucket.put('articles/orphan/no-row.webp', new Uint8Array([1]))
    await bucket.put('articles/kept/has-row.webp', new Uint8Array([1]))

    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
    await env.DB.prepare(
      "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a1', 'T', 't', 'ai', 'draft', '[]', 'w1')"
    ).run()
    await env.DB.prepare(
      "INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', 'a1', 'articles/kept/has-row.webp', '')"
    ).run()

    const response = await GET()
    expect(response.status).toBe(200)
    const body = (await response.json()) as { deleted: number }
    expect(body.deleted).toBe(0)

    expect(await bucket.get('articles/orphan/no-row.webp')).not.toBeNull()
    expect(await bucket.get('articles/kept/has-row.webp')).not.toBeNull()
  })
})
