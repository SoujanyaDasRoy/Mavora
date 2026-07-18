import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { getWriter, getOrCreateWriter } from './writers'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM writers').run()
})

describe('writers', () => {
  it('returns null for a writer that does not exist', async () => {
    const writer = await getWriter(env.DB, 'clerk_nonexistent')
    expect(writer).toBeNull()
  })

  it('creates a new writer with role "writer" on first sync', async () => {
    const writer = await getOrCreateWriter(env.DB, 'clerk_abc', 'Jane Doe')
    expect(writer.id).toBe('clerk_abc')
    expect(writer.role).toBe('writer')
    expect(writer.displayName).toBe('Jane Doe')
  })

  it('returns the existing writer on a second sync without creating a duplicate', async () => {
    await getOrCreateWriter(env.DB, 'clerk_abc', 'Jane Doe')
    const second = await getOrCreateWriter(env.DB, 'clerk_abc', 'Jane Doe')
    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM writers WHERE id = ?')
      .bind('clerk_abc')
      .first<{ c: number }>()
    expect(count?.c).toBe(1)
    expect(second.id).toBe('clerk_abc')
  })
})
