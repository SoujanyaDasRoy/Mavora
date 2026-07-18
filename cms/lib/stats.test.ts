import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { getR2UsedBytes, R2_FREE_TIER_BYTES } from './stats'

beforeEach(async () => {
  // R2 has no bulk-delete-all; clear out anything a previous test left behind
  // so each test starts from an empty bucket.
  const existing = await env.MEDIA_BUCKET.list()
  for (const obj of existing.objects) {
    await env.MEDIA_BUCKET.delete(obj.key)
  }
})

describe('R2_FREE_TIER_BYTES', () => {
  it('is exactly 10 GiB', () => {
    expect(R2_FREE_TIER_BYTES).toBe(10 * 1024 * 1024 * 1024)
  })
})

describe('getR2UsedBytes', () => {
  it('returns 0 for an empty bucket', async () => {
    const total = await getR2UsedBytes(env.MEDIA_BUCKET)
    expect(total).toBe(0)
  })

  it('sums object sizes that all fit on a single list() page', async () => {
    await env.MEDIA_BUCKET.put('a', new TextEncoder().encode('12345').buffer)
    await env.MEDIA_BUCKET.put('b', new TextEncoder().encode('1234567890').buffer)

    const total = await getR2UsedBytes(env.MEDIA_BUCKET)
    expect(total).toBe(15)
  })

  it('paginates across multiple list() pages and sums every object', async () => {
    // Force a 1-object-per-page listing (well below the real R2/Miniflare
    // default of 1000) so this test actually exercises the cursor/truncated
    // continuation loop instead of only ever hitting a single page.
    const sizes = [5, 7, 11, 13, 17]
    for (let i = 0; i < sizes.length; i++) {
      await env.MEDIA_BUCKET.put(`obj-${i}`, new Uint8Array(sizes[i]).buffer)
    }

    const total = await getR2UsedBytes(env.MEDIA_BUCKET, { pageSize: 1 })
    expect(total).toBe(sizes.reduce((sum, n) => sum + n, 0))
  })
})
