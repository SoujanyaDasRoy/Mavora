'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { ThemeToggle } from './ThemeToggle'
import { SearchBox } from './SearchBox'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  return (
    <header className={`sticky top-0 z-50 w-full bg-white dark:bg-[#3c3c3c] border-b border-[var(--color-border)] transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="mx-auto max-w-[1280px] px-5 md:px-8 h-[60px] flex items-center justify-between gap-6">

        {/* ── Logo ──────────────────────────────────────────────
            The JPG logos have a solid background baked in.
            We display them with object-fit:cover to crop to the
            text area, and mix-blend-mode to dissolve the
            background into the header colour:
            • Light mode (white header): multiply
            • Dark mode  (#3c3c3c header): screen           */}
        <Link href="/" className="shrink-0 flex items-center" aria-label="Mavora home">
          {/* Light mode logo */}
          <img
            src="/logo-light.jpg"
            alt="Mavora"
            className="block dark:hidden"
            style={{
              width: '160px',
              height: '44px',
              objectFit: 'cover',
              objectPosition: 'center 50%',
              mixBlendMode: 'multiply',
            }}
          />
          {/* Dark mode logo */}
          <img
            src="/logo-dark.jpg"
            alt="Mavora"
            className="hidden dark:block"
            style={{
              width: '160px',
              height: '44px',
              objectFit: 'cover',
              objectPosition: 'center 50%',
              mixBlendMode: 'screen',
            }}
          />
        </Link>

        {/* ── Desktop Nav ───────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center" aria-label="Main navigation">
          <Link href="/" className="px-3 py-2 text-sm font-medium text-[var(--color-fg)] dark:text-white hover:text-[var(--color-accent)] transition-colors">
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link
              key={pillar}
              href={`/${pillar}`}
              className="px-3 py-2 text-sm font-medium text-[var(--color-fg)] dark:text-white hover:text-[var(--color-accent)] transition-colors"
            >
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
            aria-expanded={searchOpen}
            className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-[var(--color-fg)] dark:text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <ThemeToggle />
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5 text-[var(--color-fg)] dark:text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[var(--color-fg)] dark:text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Expandable search bar ──────────────────────────── */}
      {searchOpen && (
        <div className="border-t border-[var(--color-border)] px-5 md:px-8 py-3 bg-[var(--color-bg-secondary)]">
          <SearchBox onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ── Mobile drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-[var(--color-border)] bg-white dark:bg-[#3c3c3c] px-5 py-4 flex flex-col gap-1"
          aria-label="Mobile navigation"
        >
          <Link href="/" onClick={() => setMobileOpen(false)} className="py-2 px-3 rounded font-medium dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link
              key={pillar}
              href={`/${pillar}`}
              onClick={() => setMobileOpen(false)}
              className="py-2 px-3 rounded font-medium dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
