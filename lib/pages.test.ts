import { describe, it, expect } from 'vitest'
import { getPageBySlug } from './pages'

describe('static page loader', () => {
  it('loads a page by slug', () => {
    const page = getPageBySlug('about')
    expect(page).not.toBeNull()
    expect(page?.title).toBe('About Mavora')
  })

  it('returns null for a missing page', () => {
    expect(getPageBySlug('does-not-exist')).toBeNull()
  })
})
