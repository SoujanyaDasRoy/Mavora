import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function prefersReducedMotion(): boolean {
  // Deliberately checks the bare global `matchMedia` rather than `window.matchMedia`:
  // this project's Vitest config runs with `environment: 'node'`, which has no `window`
  // global at all (only `globalThis`), so tests stub `matchMedia` directly on globalThis.
  // A bare identifier reference resolves through globalThis in both Node and browsers,
  // and `typeof` never throws on an undeclared identifier, so this stays SSR-safe too.
  if (typeof matchMedia !== 'function') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function revealOnScroll(element: HTMLElement, options?: { delay?: number }): void {
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 })
    return
  }

  gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay: options?.delay ?? 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        once: true,
      },
    }
  )
}
