import { describe, it, expect } from 'vitest'
import { isSafeHttpUrl } from './safe-url'

describe('isSafeHttpUrl', () => {
  it('accepts a well-formed https:// URL', () => {
    expect(isSafeHttpUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
  })

  it('accepts a well-formed http:// URL', () => {
    expect(isSafeHttpUrl('http://example.com')).toBe(true)
  })

  it('rejects a javascript: URL even though it parses as a valid URL', () => {
    // Confirms the underlying assumption this check exists to guard against:
    // the WHATWG URL parser happily accepts `javascript:` as a scheme.
    expect(() => new URL('javascript:alert(1)')).not.toThrow()
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects a data: URL', () => {
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects an unparseable/relative string', () => {
    expect(isSafeHttpUrl('not a url')).toBe(false)
  })
})
