import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { GET, POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W1')").run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('admin1', 'admin', 'Admin')").run()
})

describe('GET /api/articles', () => {
  it('returns only the caller\'s articles for a writer', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Mine', pillar: 'ai' }),
    }))

    const response = await GET(new Request('https://x/api/articles'))
    const body = await response.json() as any[]
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Mine')
  })
})

describe('POST /api/articles', () => {
  it('creates a draft owned by the authenticated writer', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    const response = await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Draft', pillar: 'business' }),
    }))
    expect(response.status).toBe(201)
    const body = await response.json() as any
    expect(body.authorId).toBe('w1')
  })

  it('rejects an invalid pillar with 400', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    const response = await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Bad', pillar: 'sports' }),
    }))
    expect(response.status).toBe(400)
  })
})
