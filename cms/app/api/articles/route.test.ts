import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/audit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/audit')>('@/lib/audit')
  return { ...actual, recordAuditEvent: vi.fn(actual.recordAuditEvent) }
})
import { auth } from '@clerk/nextjs/server'
import { recordAuditEvent } from '@/lib/audit'
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

  it('records an audit event on create', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    const response = await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Audited', pillar: 'ai' }),
    }))
    expect(response.status).toBe(201)
    const body = await response.json() as any

    const auditRow = await env.DB.prepare('SELECT * FROM audit_log WHERE article_id = ?')
      .bind(body.id)
      .first()
    expect(auditRow?.actor_id).toBe('w1')
    expect(auditRow?.action).toBe('create')
  })

  it('still returns 201 when recordAuditEvent fails', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    ;(recordAuditEvent as any).mockRejectedValueOnce(new Error('audit write failed'))

    const response = await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Still works', pillar: 'ai' }),
    }))
    expect(response.status).toBe(201)
  })
})
