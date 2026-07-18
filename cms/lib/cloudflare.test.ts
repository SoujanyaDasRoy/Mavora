import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'

describe('D1 schema', () => {
  it('has the writers, articles, and media tables', async () => {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('writers','articles','media')"
    ).all()
    const names = result.results.map((r: any) => r.name).sort()
    expect(names).toEqual(['articles', 'media', 'writers'])
  })
})
