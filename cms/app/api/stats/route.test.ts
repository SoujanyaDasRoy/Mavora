import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { createDraft } from '@/lib/articles'
import { GET } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
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
})
