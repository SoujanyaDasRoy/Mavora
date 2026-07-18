import { describe, it, expect } from 'vitest'
import { isTrustedOrigin } from './csrf'

describe('isTrustedOrigin', () => {
  it('accepts a request whose Origin header matches the expected origin', () => {
    const request = new Request('https://app.mavora.com/api/articles', {
      method: 'POST',
      headers: { Origin: 'https://app.mavora.com' },
    })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(true)
  })

  it('rejects a request with a mismatched Origin header', () => {
    const request = new Request('https://app.mavora.com/api/articles', {
      method: 'POST',
      headers: { Origin: 'https://evil.example.com' },
    })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(false)
  })

  it('rejects a request with no Origin header on a mutating method', () => {
    const request = new Request('https://app.mavora.com/api/articles', { method: 'POST' })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(false)
  })

  it('does not require Origin on a GET request', () => {
    const request = new Request('https://app.mavora.com/api/articles', { method: 'GET' })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(true)
  })
})
