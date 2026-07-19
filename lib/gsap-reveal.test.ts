import { describe, it, expect, vi, afterEach } from 'vitest'

// This project's Vitest config runs with `environment: 'node'` (no jsdom, see
// vitest.config.ts), so we can't mount a real DOM element and let GSAP actually
// create a ScrollTrigger against it. Instead we mock the `gsap` module itself and
// assert on the *contract* revealOnScroll must uphold for RevealSection's cleanup
// to work: it must return exactly what `gsap.fromTo` returns (a killable tween,
// which GSAP attaches its ScrollTrigger to as `.scrollTrigger`) in the animated
// path, and `undefined` in the reduced-motion path (nothing to kill there).
const { setMock, fromToMock } = vi.hoisted(() => ({
  setMock: vi.fn(),
  fromToMock: vi.fn(),
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: setMock,
    fromTo: fromToMock,
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}))

const { prefersReducedMotion, revealOnScroll } = await import('./gsap-reveal')

afterEach(() => {
  vi.unstubAllGlobals()
  setMock.mockClear()
  fromToMock.mockClear()
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

describe('revealOnScroll', () => {
  const element = {} as HTMLElement

  it('applies final styles via gsap.set and returns undefined when reduced motion is preferred (nothing to clean up)', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    const result = revealOnScroll(element)

    expect(setMock).toHaveBeenCalledWith(element, { opacity: 1, y: 0 })
    expect(fromToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('returns the gsap.fromTo tween so callers can kill it (and its ScrollTrigger) on cleanup', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const fakeTween = { kill: vi.fn(), scrollTrigger: { kill: vi.fn() } }
    fromToMock.mockReturnValue(fakeTween)

    const result = revealOnScroll(element, { delay: 0.3 })

    expect(fromToMock).toHaveBeenCalledWith(
      element,
      { opacity: 0, y: 20 },
      expect.objectContaining({
        opacity: 1,
        y: 0,
        delay: 0.3,
        scrollTrigger: expect.objectContaining({ trigger: element, start: 'top 85%', once: true }),
      })
    )
    // This is the crux of the leak fix: the caller (RevealSection) needs this exact
    // object back so its cleanup function can call tween.scrollTrigger.kill() and
    // tween.kill() on unmount.
    expect(result).toBe(fakeTween)
  })
})
