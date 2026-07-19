import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { recordAuditEvent, deleteOldAuditLogs, AUDIT_LOG_RETENTION_DAYS } from './audit'

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

// audit_log (Task 16) has no cleanup mechanism and grows unboundedly. This
// mirrors the existing R2 orphan-cleanup pattern (lib/media-cleanup.ts):
// delete rows older than a retention window, run from the same weekly Cron
// Trigger (workers/scheduled-entry.js) rather than a new one.
describe('deleteOldAuditLogs', () => {
  async function insertAuditRow(id: string, daysAgo: number): Promise<void> {
    await env.DB.prepare(
      `INSERT INTO audit_log (id, actor_id, action, article_id, created_at) VALUES (?, 'w1', 'update', NULL, datetime('now', ?))`
    )
      .bind(id, `-${daysAgo} days`)
      .run()
  }

  it('deletes rows older than the given retention window and keeps newer ones', async () => {
    await insertAuditRow('old', 100)
    await insertAuditRow('recent', 10)

    const deletedCount = await deleteOldAuditLogs(env.DB, 90)
    expect(deletedCount).toBe(1)

    const remaining = (await env.DB.prepare('SELECT id FROM audit_log').all()).results as { id: string }[]
    expect(remaining.map((r) => r.id)).toEqual(['recent'])
  })

  it('defaults to a 90-day retention window when no argument is passed', async () => {
    expect(AUDIT_LOG_RETENTION_DAYS).toBe(90)

    await insertAuditRow('too-old', 91)
    await insertAuditRow('within-window', 89)

    const deletedCount = await deleteOldAuditLogs(env.DB)
    expect(deletedCount).toBe(1)

    const remaining = (await env.DB.prepare('SELECT id FROM audit_log').all()).results as { id: string }[]
    expect(remaining.map((r) => r.id)).toEqual(['within-window'])
  })

  it('returns 0 and deletes nothing when every row is within the window', async () => {
    await insertAuditRow('fresh', 1)
    const deletedCount = await deleteOldAuditLogs(env.DB, 90)
    expect(deletedCount).toBe(0)
    expect(await env.DB.prepare('SELECT COUNT(*) as c FROM audit_log').first<{ c: number }>()).toMatchObject({ c: 1 })
  })
})
