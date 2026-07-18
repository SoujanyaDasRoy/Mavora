import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(() => ({
    invitations: { createInvitation: vi.fn().mockResolvedValue({ id: 'inv_123' }) },
  })),
}))

import { auth } from '@clerk/nextjs/server'
import { POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM writers').run()
})

describe('POST /api/writers/invite', () => {
  it('rejects a non-admin writer with 403', async () => {
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('clerk_writer', 'writer', 'W')").run()
    ;(auth as any).mockResolvedValue({ userId: 'clerk_writer' })

    const request = new Request('https://cms.example.com/api/writers/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('allows an admin to invite a writer', async () => {
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('clerk_admin', 'admin', 'A')").run()
    ;(auth as any).mockResolvedValue({ userId: 'clerk_admin' })

    const request = new Request('https://cms.example.com/api/writers/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('rejects an invalid email with 400', async () => {
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('clerk_admin', 'admin', 'A')").run()
    ;(auth as any).mockResolvedValue({ userId: 'clerk_admin' })

    const request = new Request('https://cms.example.com/api/writers/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
