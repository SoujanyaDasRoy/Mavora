import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { env } from 'cloudflare:test'
import {
  validateUpload,
  uploadToR2,
  recordMedia,
  deleteMediaObjects,
  deleteMediaObjectByKey,
  getPublicMediaUrl,
  r2KeyFromPublicUrl,
  MAX_IMAGE_BYTES,
  MAX_MEDIA_PER_ARTICLE,
} from './media'

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

describe('deleteMediaObjects', () => {
  it('deletes every R2 object recorded for the given article, and leaves other articles alone', async () => {
    const bucket = env.MEDIA_BUCKET
    await env.DB.prepare(
      "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a2', 'T2', 't2', 'ai', 'draft', '[]', 'w1')"
    ).run()

    await bucket.put('articles/a1/one.webp', new Uint8Array([1]))
    await bucket.put('articles/a1/two.webp', new Uint8Array([1]))
    await bucket.put('articles/a2/keep.webp', new Uint8Array([1]))
    await recordMedia(env.DB, 'a1', 'articles/a1/one.webp', '')
    await recordMedia(env.DB, 'a1', 'articles/a1/two.webp', '')
    await recordMedia(env.DB, 'a2', 'articles/a2/keep.webp', '')

    await deleteMediaObjects(bucket, env.DB, 'a1')

    expect(await bucket.get('articles/a1/one.webp')).toBeNull()
    expect(await bucket.get('articles/a1/two.webp')).toBeNull()
    expect(await bucket.get('articles/a2/keep.webp')).not.toBeNull()
  })

  it('does nothing when the article has no media rows', async () => {
    await expect(deleteMediaObjects(env.MEDIA_BUCKET, env.DB, 'a1')).resolves.toBeUndefined()
  })
})

describe('deleteMediaObjectByKey', () => {
  it('deletes only the matching article + r2Key row and R2 object, leaving other media alone', async () => {
    const bucket = env.MEDIA_BUCKET
    await bucket.put('articles/a1/old-cover.webp', new Uint8Array([1]))
    await bucket.put('articles/a1/inline.webp', new Uint8Array([1]))
    await recordMedia(env.DB, 'a1', 'articles/a1/old-cover.webp', 'old cover')
    await recordMedia(env.DB, 'a1', 'articles/a1/inline.webp', 'inline image')

    await deleteMediaObjectByKey(bucket, env.DB, 'a1', 'articles/a1/old-cover.webp')

    expect(await bucket.get('articles/a1/old-cover.webp')).toBeNull()
    expect(await bucket.get('articles/a1/inline.webp')).not.toBeNull()

    const rows = (
      await env.DB.prepare('SELECT r2_key FROM media WHERE article_id = ?').bind('a1').all()
    ).results as { r2_key: string }[]
    expect(rows.map((r) => r.r2_key)).toEqual(['articles/a1/inline.webp'])
  })

  it('does nothing when no media row matches the given article + r2Key', async () => {
    await expect(
      deleteMediaObjectByKey(env.MEDIA_BUCKET, env.DB, 'a1', 'articles/a1/does-not-exist.webp')
    ).resolves.toBeUndefined()
  })

  it('does not delete a same-key row belonging to a different article', async () => {
    await env.DB.prepare(
      "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a2', 'T2', 't2', 'ai', 'draft', '[]', 'w1')"
    ).run()
    const bucket = env.MEDIA_BUCKET
    await bucket.put('shared-key.webp', new Uint8Array([1]))
    await recordMedia(env.DB, 'a2', 'shared-key.webp', '')

    await deleteMediaObjectByKey(bucket, env.DB, 'a1', 'shared-key.webp')

    expect(await bucket.get('shared-key.webp')).not.toBeNull()
    const row = await env.DB.prepare('SELECT id FROM media WHERE article_id = ? AND r2_key = ?')
      .bind('a2', 'shared-key.webp')
      .first()
    expect(row).not.toBeNull()
  })
})

describe('r2KeyFromPublicUrl', () => {
  const originalBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL

  afterEach(() => {
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = originalBase
  })

  it('recovers the r2Key from a URL built by getPublicMediaUrl (round-trip)', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    const url = getPublicMediaUrl('articles/a1/cover.webp')
    expect(r2KeyFromPublicUrl(url)).toBe('articles/a1/cover.webp')
  })

  it('round-trips correctly even when the base URL has a trailing slash', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com/'
    expect(r2KeyFromPublicUrl('https://media.example.com/articles/a1/cover.webp')).toBe('articles/a1/cover.webp')
  })

  it('returns null when the URL does not match the configured base', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    expect(r2KeyFromPublicUrl('https://other-host.example.com/articles/a1/cover.webp')).toBeNull()
  })

  it('returns null rather than throwing when no base URL is configured', () => {
    delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    expect(r2KeyFromPublicUrl('https://media.example.com/articles/a1/cover.webp')).toBeNull()
  })
})

describe('getPublicMediaUrl', () => {
  const originalBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL

  afterEach(() => {
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = originalBase
  })

  it('joins the configured base URL and the r2 key', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    expect(getPublicMediaUrl('articles/a1/cover.webp')).toBe('https://media.example.com/articles/a1/cover.webp')
  })

  it('tolerates a trailing slash on the configured base URL', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com/'
    expect(getPublicMediaUrl('articles/a1/cover.webp')).toBe('https://media.example.com/articles/a1/cover.webp')
  })

  it('throws a clear error when the base URL is not configured', () => {
    delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    expect(() => getPublicMediaUrl('articles/a1/cover.webp')).toThrow(/NEXT_PUBLIC_MEDIA_BASE_URL/)
  })
})
