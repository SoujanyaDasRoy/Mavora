'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Status bar — the CMS's signature element. Lives at the bottom of every
 * admin page, just below the main content. Reads like a recording-studio
 * control strip: three VU-style dots (live, sync, ok) plus a clock. The
 * amber dot pulses via the `.vu-dot` keyframe in `app/globals.css`.
 *
 * Intentionally low-information. It exists to give the workspace a sense
 * of being *on* — like a powered-up mixing desk — without competing with
 * the actual content above it.
 */
export function StatusBar() {
  const pathname = usePathname()
  const [now, setNow] = useState<Date | null>(null)

  // Render time on the client only to avoid a hydration mismatch — server
  // and client clocks differ in the millisecond range, which is enough to
  // trip React's text-content equality check.
  useEffect(() => {
    setNow(new Date())
    const interval = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const time = now
    ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--'
  const channel = pathnameToChannel(pathname)

  return (
    <div
      className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--color-border)] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <span className="relative inline-block size-2 rounded-full bg-[var(--color-accent)] vu-dot" aria-hidden />
          <span>Live</span>
        </span>
        <span aria-hidden className="text-[var(--color-border-strong)]">·</span>
        <span className="hidden sm:inline">Sync OK</span>
        <span aria-hidden className="hidden sm:inline text-[var(--color-border-strong)]">·</span>
        <span>CH {channel}</span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/settings" className="hover:text-[var(--color-fg)] transition-colors">
          Mavora CMS
        </Link>
        <span aria-hidden className="text-[var(--color-border-strong)]">·</span>
        <span className="tabular-nums">{time}</span>
      </div>
    </div>
  )
}

/**
 * Maps the current route to a short "channel" label — the studio metaphor
 * carries through. Five channels cover all admin pages; the rest fall back
 * to a generic label.
 */
function pathnameToChannel(pathname: string): string {
  if (!pathname) return '01'
  if (pathname.startsWith('/dashboard')) return '01'
  if (pathname.startsWith('/articles/new')) return '02'
  if (pathname.startsWith('/articles/')) return '03'
  if (pathname.startsWith('/articles')) return '04'
  if (pathname.startsWith('/media')) return '05'
  if (pathname.startsWith('/writers')) return '06'
  if (pathname.startsWith('/settings')) return '07'
  return '00'
}