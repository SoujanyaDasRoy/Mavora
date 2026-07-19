'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  return (
    <header className="border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)] z-50">
      <div className="mx-auto max-w-[1280px] px-6 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-extrabold tracking-wide text-xl text-[var(--color-accent)]">
          MAVORA
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link key={pillar} href={`/${pillar}`} className="hover:text-[var(--color-accent)] transition-colors">
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="Search" className="rounded-full p-2 hover:bg-[var(--color-border)] transition-colors">
            🔍
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="md:hidden rounded-full p-2 hover:bg-[var(--color-border)] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-[var(--color-border)] px-6 py-4 flex flex-col gap-3">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link key={pillar} href={`/${pillar}`} onClick={() => setMobileOpen(false)}>
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
