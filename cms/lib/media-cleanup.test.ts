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
    // technique as lib/stats.test.ts's pagination test.
    await seedArticle('a1')
    const orphanKeys = ['orphan-0', 'orphan-1', 'orphan-2', 'orphan-3']
    for (const key of orphanKeys) {
      await env.MEDIA_BUCKET.put(key, new Uint8Array([1]))
    }
    await env.MEDIA_BUCKET.put('kept-1', new Uint8Array([1]))
    await env.DB.prepare("INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', 'a1', 'kept-1', '')").run()

    const deleted = await cleanupOrphanedMedia(env.DB, env.MEDIA_BUCKET, { pageSize: 1 })
    expect(deleted).toBe(orphanKeys.length)

    for (const key of orphanKeys) {
      expect(await env.MEDIA_BUCKET.get(key)).toBeNull()
    }
    expect(await env.MEDIA_BUCKET.get('kept-1')).not.toBeNull()
  })
})
