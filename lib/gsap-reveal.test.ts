import { describe, it, expect, vi, afterEach } from 'vitest'
import { prefersReducedMotion } from './gsap-reveal'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('prefersReducedMotion', () => {
  it('returns true when the media query matches', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(prefersReducedMotion()).toBe(true)
  })

  it('returns false when the media query does not match', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns false when matchMedia is unavailable (SSR safety)', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})
