'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { revealOnScroll } from '@/lib/gsap-reveal'

interface RevealSectionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function RevealSection({ children, delay, className }: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const tween = revealOnScroll(ref.current, { delay })

    return () => {
      // Kill the ScrollTrigger instance first (it also kills its tween unless told
      // not to), then kill the tween too for good measure — both calls are safe to
      // make even if the other already ran, so this order is defensive, not required.
      tween?.scrollTrigger?.kill()
      tween?.kill()
    }
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
