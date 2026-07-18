import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { createDraft } from '@/lib/articles'
import { GET } from './route'

const originalFetch = global.fetch

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
})

afterEach(() => {
  global.fetch = originalFetch
  vi.unstubAllEnvs()
})

describe('GET /api/stats', () => {
  it('counts drafts and published articles scoped to the caller', async () => {
    const a1 = await createDraft(env.DB, { title: 'A', pillar: 'ai', authorId: 'w1' })
    await createDraft(env.DB, { title: 'B', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("UPDATE articles SET status = 'published' WHERE id = ?").bind(a1.id).run()
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await GET()
    const body = await response.json() as any
    expect(body.draftCount).toBe(1)
    expect(body.publishedCount).toBe(1)
    expect(typeof body.r2UsedBytes).toBe('number')
    expect(body.r2FreeTierBytes).toBe(10 * 1024 * 1024 * 1024)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(auth as any).mockResolvedValue({ userId: null })

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns 403 for an authenticated user with no writer record', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'unknown-user' })

    const response = await GET()
    expect(response.status).toBe(403)
  })

  it('includes subscriber count and page views, falling back to null on API failure', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    vi.stubEnv('BUTTONDOWN_API_KEY', 'test-buttondown-key')
    vi.stubEnv('CLOUDFLARE_ANALYTICS_API_TOKEN', 'test-cf-token')
    vi.stubEnv('CLOUDFLARE_ZONE_TAG', 'test-zone-tag')
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 42 }), { status: 200 })) // Buttondown
      .mockResolvedValueOnce(new Response('server error', { status: 500 })) // Cloudflare Analytics fails

    const response = await GET()
    const body = await response.json() as any
    expect(body.subscriberCount).toBe(42)
    expect(body.pageViews30d).toBeNull()
  })
})
