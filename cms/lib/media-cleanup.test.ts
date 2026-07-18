import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { cleanupOrphanedMedia } from './media-cleanup'

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

/** Inserts a writer + article so `media` rows can satisfy their FK. */
async function seedArticle(articleId: string): Promise<void> {
  await env.DB.prepare("INSERT OR IGNORE INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
  await env.DB.prepare(
    'INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(articleId, 'T', articleId, 'ai', 'draft', '[]', 'w1')
    .run()
}

describe('cleanupOrphanedMedia', () => {
  it('returns 0 for an empty bucket', async () => {
    const deleted = await cleanupOrphanedMedia(env.DB, env.MEDIA_BUCKET)
    expect(deleted).toBe(0)
  })

  it('does not delete anything when every object has a matching media row', async () => {
    await seedArticle('a1')
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', 'a1', 'kept-1', '')").run()
    await env.MEDIA_BUCKET.put('kept-1', new Uint8Array([1]))

    const deleted = await cleanupOrphanedMedia(env.DB, env.MEDIA_BUCKET)
    expect(deleted).toBe(0)
    expect(await env.MEDIA_BUCKET.get('kept-1')).not.toBeNull()
  })

  it('deletes every orphan across multiple list() pages and leaves known keys alone', async () => {
    // Force a 1-object-per-page listing (well below the real R2/Miniflare
    // default of 1000) so this test actually exercises the cursor/truncated
    // continuation loop instead of only ever hitting a single page -- same
    // technique as lib/stats.test.ts's pagination test. `gracePeriodMs: 0`
    // disables the age-based grace period (covered by its own test below) so
    // this test can keep asserting on immediate deletion of orphans.
    await seedArticle('a1')
    const orphanKeys = ['orphan-0', 'orphan-1', 'orphan-2', 'orphan-3']
    for (const key of orphanKeys) {
      await env.MEDIA_BUCKET.put(key, new Uint8Array([1]))
    }
    await env.MEDIA_BUCKET.put('kept-1', new Uint8Array([1]))
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', 'a1', 'kept-1', '')").run()

    const deleted = await cleanupOrphanedMedia(env.DB, env.MEDIA_BUCKET, { pageSize: 1, gracePeriodMs: 0 })
    expect(deleted).toBe(orphanKeys.length)

    for (const key of orphanKeys) {
      expect(await env.MEDIA_BUCKET.get(key)).toBeNull()
    }
    expect(await env.MEDIA_BUCKET.get('kept-1')).not.toBeNull()
  })

  // Closes the TOCTOU race described in the Task 17 brief: `cleanupOrphanedMedia`
  // snapshots `known` media rows from D1 *before* paginating R2, so an object
  // whose R2 upload lands after that snapshot but whose `media` row hasn't
  // committed yet would otherwise look orphaned and get deleted out from
  // under a legitimate, in-flight upload. Guarding on the R2 object's real
  // `uploaded` timestamp (which Miniflare's R2 simulator sets to the actual
  // wall-clock `put()` time -- verified directly: a `head()` immediately
  // after `put()` returns an `uploaded` Date within ~30ms of `Date.now()`,
  // and it advances correctly after a real sleep) means a just-uploaded
  // object always survives the pass it raced with, and is only ever
  // reconsidered on a later run once it's unambiguously either claimed by a
  // `media` row or genuinely abandoned.
  //
  // `options.gracePeriodMs` exists only so this test can use a millisecond
  // grace window instead of the real ~15-minute production threshold --
  // same rationale as `options.pageSize` above.
  it('skips a recently-uploaded orphan (within the grace period) but deletes an old one', async () => {
    await env.MEDIA_BUCKET.put('old-orphan', new Uint8Array([1]))
    // Real wall-clock sleep so 'old-orphan' is unambiguously older than the
    // grace window below by the time cleanup runs.
    await new Promise((resolve) => setTimeout(resolve, 100))

    await env.MEDIA_BUCKET.put('fresh-orphan', new Uint8Array([1]))

    const deleted = await cleanupOrphanedMedia(env.DB, env.MEDIA_BUCKET, { gracePeriodMs: 50 })
    expect(deleted).toBe(1)

    expect(await env.MEDIA_BUCKET.get('old-orphan')).toBeNull()
    expect(await env.MEDIA_BUCKET.get('fresh-orphan')).not.toBeNull()
  })
})
