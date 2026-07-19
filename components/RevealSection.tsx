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
    if (ref.current) revealOnScroll(ref.current, { delay })
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
