'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { ThemeToggle } from './ThemeToggle'
import { SearchBox } from './SearchBox'

const TICKER_ITEMS = [
  "GPT-5 arrives: OpenAI's most capable model reshapes the AI landscape",
  "Apple Intelligence vs. Gemini: On-device AI race heats up",
  "Indie SaaS founders hit record $10K MRR milestones in Q2 2026",
  "Autonomous coding agents now shipping production PRs without human oversight",
  "Deep Work frameworks adapted for the AI-native workplace",
  "Mechanical keyboards see record sales among remote developers",
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  // Detect scroll for header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  const tickerText = TICKER_ITEMS.join('   ·   ')

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)] transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      {/* ── Breaking News Ticker ────────────────────────────── */}
      <div className="w-full bg-[var(--color-accent)] overflow-hidden py-1.5 select-none">
        <div className="relative flex overflow-hidden">
          {/* BREAKING label */}
          <span className="shrink-0 z-10 bg-[var(--color-accent)] pr-3 pl-4 font-extrabold text-white text-[10px] tracking-widest uppercase flex items-center gap-2 relative">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Breaking
          </span>
          {/* Scrolling track — doubled for seamless loop */}
          <div className="ticker-track text-white text-[11px] font-medium">
            <span className="pr-16">{tickerText}</span>
            <span className="pr-16" aria-hidden="true">{tickerText}</span>
          </div>
        </div>
      </div>

      {/* ── Main Header Row ─────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo / Wordmark — intentionally blank per user request */}
        <Link href="/" className="flex flex-col items-start shrink-0">
          {/* Blank logo area — replace with your actual logo/image/SVG */}
          <span className="font-extrabold text-2xl tracking-tight leading-none text-[var(--color-fg)]">
            {/* Insert logo here */}
          </span>
          {/* Tagline */}
          <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--color-fg-muted)] mt-0.5 hidden sm:block">
            Knowledge for the Ambitious
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-semibold hover:text-[var(--color-accent)] transition-colors rounded"
          >
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link
              key={pillar}
              href={`/${pillar}`}
              className="px-3 py-1.5 text-sm font-semibold hover:text-[var(--color-accent)] transition-colors rounded"
            >
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
            aria-expanded={searchOpen}
            className="p-2 rounded-md hover:bg-[var(--color-border)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <ThemeToggle />
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md hover:bg-[var(--color-border)] transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Expandable Search Bar ────────────────────────────── */}
      {searchOpen && (
        <div className="border-t border-[var(--color-border)] px-6 md:px-8 py-3 bg-[var(--color-bg-secondary)]">
          <SearchBox onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4 flex flex-col gap-1"
          aria-label="Mobile navigation"
        >
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-3 rounded font-semibold hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link
              key={pillar}
              href={`/${pillar}`}
              onClick={() => setMobileOpen(false)}
              className="py-2 px-3 rounded font-semibold hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
