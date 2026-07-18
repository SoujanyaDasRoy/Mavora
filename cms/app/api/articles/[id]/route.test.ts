import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { createDraft } from '@/lib/articles'
import { GET, PATCH } from './route'

beforeEach(async () => {
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
})
