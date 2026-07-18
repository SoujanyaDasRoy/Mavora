import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM media').run()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
  await env.DB.prepare(
    "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a1', 'T', 't', 'ai', 'draft', '[]', 'w1')"
  ).run()
})

describe('POST /api/media/upload', () => {
  it('uploads a valid image and returns its R2 key', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const form = new FormData()
    form.append('articleId', 'a1')
    form.append('altText', 'Alt text')
    form.append('file', new File([new Uint8Array(1000)], 'photo.webp', { type: 'image/webp' }))

    const response = await POST(new Request('https://x/api/media/upload', { method: 'POST', body: form }))
    expect(response.status).toBe(201)
    const body = await response.json() as any
    expect(body.r2Key).toContain('a1')
  })

  it('rejects an oversized file with 400', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const form = new FormData()
    form.append('articleId', 'a1')
    form.append('altText', 'Alt text')
    form.append('file', new File([new Uint8Array(900 * 1024)], 'big.webp', { type: 'image/webp' }))

    const response = await POST(new Request('https://x/api/media/upload', { method: 'POST', body: form }))
    expect(response.status).toBe(400)
  })

  it('rejects an upload to an article owned by a different writer', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'someone-else' })
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('someone-else', 'writer', 'X')").run()

    const form = new FormData()
    form.append('articleId', 'a1')
    form.append('altText', 'Alt text')
    form.append('file', new File([new Uint8Array(1000)], 'photo.webp', { type: 'image/webp' }))

    const response = await POST(new Request('https://x/api/media/upload', { method: 'POST', body: form }))
    expect(response.status).toBe(403)
  })
})
