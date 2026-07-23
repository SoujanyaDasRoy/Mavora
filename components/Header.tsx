'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { ThemeToggle } from './ThemeToggle'
import { SearchBox } from './SearchBox'
import { Search } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Container } from '@/components/Container'

/* ── Minimal inline SVG icons (no icon library) ─────────────── */
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    ...PILLARS.map((p) => ({ label: PILLAR_LABELS[p], href: `/${p}` })),
    { label: 'Newsletter', href: '/#newsletter' },
  ]

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full bg-[var(--color-bg)] border-b border-[var(--color-border)]',
        'transition-shadow duration-200',
        scrolled ? 'shadow-sm' : '',
      ].join(' ')}
    >
      <Container
        className="h-[70px] grid grid-cols-[auto_1fr_auto] md:grid-cols-[220px_1fr_220px] items-center gap-4"
      >
        {/* ── Logo ─────────────────────────────────────────── */}
        <Link href="/" className="shrink-0 flex items-center" aria-label="Mavora home">
          <img
            src="/logo.png"
            alt="Mavora"
            style={{ width: '180px', height: '51px', objectFit: 'contain' }}
          />
        </Link>

        {/* ── Desktop nav ──────────────────────────────────────── */}
        <nav className="hidden md:flex items-center justify-center gap-1.5" aria-label="Main navigation">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={[
                'relative px-3.5 py-2.5 text-[14px] font-medium transition-colors',
                'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
                'after:absolute after:bottom-1 after:left-3.5 after:right-3.5 after:h-[1.5px]',
                'after:bg-[var(--color-fg-muted)] after:scale-x-0 after:origin-left',
                'hover:after:scale-x-100 after:transition-transform after:duration-200',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ───────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 shrink-0 w-full">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search articles"
            className="flex items-center justify-center size-9 hover:bg-[var(--color-bg-secondary)] rounded-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] outline-none transition-colors"
          >
            <Search className="size-4" />
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Mobile menu — shadcn Sheet */}
          <Sheet>
            <SheetTrigger
              className={[
                'md:hidden inline-flex items-center justify-center size-9 rounded-md',
                'text-[var(--color-fg)] hover:text-[var(--color-accent)]',
                'hover:bg-[var(--color-bg-secondary)] transition-colors',
              ].join(' ')}
              aria-label="Open menu"
            >
              <MenuIcon />
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton
              className="w-[280px] bg-[var(--color-bg)] border-[var(--color-border)] pt-10 px-0"
            >
              <SheetHeader className="px-5 pb-3">
                <SheetTitle className="text-left">
                  <img
                    src="/logo.png"
                    alt="Mavora"
                    style={{ width: '100px', height: '28px', objectFit: 'contain' }}
                  />
                </SheetTitle>
              </SheetHeader>

              <Separator className="bg-[var(--color-border)]" />

              <nav className="flex flex-col px-4 pt-3 gap-0.5" aria-label="Mobile navigation">
                {navLinks.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      'w-full py-2.5 px-3 rounded-md text-sm font-medium transition-colors',
                      'text-[var(--color-fg)] hover:text-[var(--color-accent)]',
                      'hover:bg-[var(--color-bg-secondary)]',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>

      {/* Conditionally render SearchBox overlay */}
      {searchOpen && (
        <SearchBox
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </header>
  )
}
