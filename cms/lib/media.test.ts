import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { validateUpload, uploadToR2, recordMedia, MAX_IMAGE_BYTES, MAX_MEDIA_PER_ARTICLE } from './media'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM media').run()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
  await env.DB.prepare(
    "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a1', 'T', 't', 'ai', 'draft', '[]', 'w1')"
  ).run()
})

describe('validateUpload', () => {
  it('accepts a JPEG under the size cap with room in the article', () => {
    const result = validateUpload({ type: 'image/jpeg', size: 500 * 1024 }, 2)
    expect(result.valid).toBe(true)
  })

  it('rejects a file over MAX_IMAGE_BYTES', () => {
    const result = validateUpload({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 }, 0)
    expect(result.valid).toBe(false)
  })

  it('rejects a non-image mime type', () => {
    const result = validateUpload({ type: 'application/pdf', size: 1000 }, 0)
    expect(result.valid).toBe(false)
  })

  it('rejects when the article already has MAX_MEDIA_PER_ARTICLE files', () => {
    const result = validateUpload({ type: 'image/webp', size: 1000 }, MAX_MEDIA_PER_ARTICLE)
    expect(result.valid).toBe(false)
  })
})

describe('uploadToR2 / recordMedia', () => {
  it('stores the object in R2 and records it in D1', async () => {
    const bucket = env.MEDIA_BUCKET
    const bytes = new TextEncoder().encode('fake-image-bytes').buffer
    await uploadToR2(bucket, 'articles/a1/cover.webp', bytes, 'image/webp')

    const stored = await bucket.get('articles/a1/cover.webp')
    expect(stored).not.toBeNull()

    const media = await recordMedia(env.DB, 'a1', 'articles/a1/cover.webp', 'A cover image')
    expect(media.r2Key).toBe('articles/a1/cover.webp')
    expect(media.altText).toBe('A cover image')
  })
})
