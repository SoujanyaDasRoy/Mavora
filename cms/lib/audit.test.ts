import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { recordAuditEvent } from './audit'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM audit_log').run()
})

describe('recordAuditEvent', () => {
  it('inserts a row with actor, action, and article id', async () => {
    await recordAuditEvent(env.DB, { actorId: 'w1', action: 'publish', articleId: 'a1' })
    const row = await env.DB.prepare('SELECT * FROM audit_log WHERE actor_id = ?').bind('w1').first()
    expect(row?.action).toBe('publish')
    expect(row?.article_id).toBe('a1')
  })
})
