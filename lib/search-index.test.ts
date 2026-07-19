import { describe, it, expect } from 'vitest'
import { getSearchIndex } from './search-index'

describe('getSearchIndex', () => {
  it('returns an entry for every non-draft post with the expected shape', () => {
    const index = getSearchIndex()
    expect(index.length).toBeGreaterThan(0)
    const entry = index[0]
    expect(entry).toHaveProperty('title')
    expect(entry).toHaveProperty('description')
    expect(entry).toHaveProperty('pillar')
    expect(entry).toHaveProperty('slug')
    expect(entry).toHaveProperty('publishedAt')
  })
})
