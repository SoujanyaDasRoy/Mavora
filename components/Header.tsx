'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'
import { ThemeToggle } from './ThemeToggle'
import { SearchBox } from './SearchBox'
import { Search, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Container } from '@/components/Container'
import { cn } from '@/lib/utils'
import type { SearchEntry } from '@/lib/search-index'

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
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const router = useRouter()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch search index when search is opened
  useEffect(() => {
    if (!searchOpen) return

    const controller = new AbortController()

    fetch('/search-index.json', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setIndex(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('error')
      })

    return () => controller.abort()
  }, [searchOpen])

  // Handle clicking outside to close
  useEffect(() => {
    if (!searchOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchOpen])

  const results = query.trim()
    ? index.filter((entry) => {
        const haystack = `${entry.title} ${entry.description}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : index.slice(0, 3)

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function go(entry: SearchEntry) {
    setSearchOpen(false)
    setQuery('')
    router.push(`/${entry.pillar}/${entry.slug}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) {
        e.preventDefault()
        go(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSearchOpen(false)
      setQuery('')
    }
  }

  const navLinks = [
    { label: 'Home', href: '/' },
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
        className={cn(
          "h-[70px] grid items-center gap-4 transition-all duration-300",
          searchOpen
            ? "grid-cols-[auto_1fr] md:grid-cols-[220px_1fr]"
            : "grid-cols-[auto_1fr_auto] md:grid-cols-[220px_1fr_220px]"
        )}
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
        {!searchOpen && (
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
        )}

        {/* ── Right controls ───────────────────────────────── */}
        <div className={cn(
          "flex items-center justify-end gap-2 shrink-0 w-full",
          searchOpen ? "col-span-1" : ""
        )}>
          {/* Search Trigger / Input container */}
          <div
            ref={searchContainerRef}
            className={cn(
              "relative flex items-center transition-all duration-300 ease-in-out",
              searchOpen
                ? "w-full md:w-[320px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full px-3.5 py-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-200"
                : "w-9 h-9 justify-center hover:bg-[var(--color-bg-secondary)] rounded-full cursor-pointer"
            )}
          >
            {searchOpen ? (
              <div className="flex items-center w-full">
                <Search className="size-4 text-[var(--color-fg-subtle)] mr-2 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full bg-transparent outline-none text-[14px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]"
                  autoFocus
                  onKeyDown={onKeyDown}
                />
                <button
                  onClick={() => {
                    setSearchOpen(false)
                    setQuery('')
                  }}
                  className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] ml-2 shrink-0 p-0.5 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search articles"
                className="flex items-center justify-center w-full h-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] outline-none"
              >
                <Search className="size-4" />
              </button>
            )}

            {/* Floating SearchBox dropdown */}
            <SearchBox
              isOpen={searchOpen}
              onClose={() => {
                setSearchOpen(false)
                setQuery('')
              }}
              query={query}
              status={status}
              results={results}
              index={index}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              onSelect={go}
            />
          </div>

          {/* Theme toggle */}
          {!searchOpen && <ThemeToggle />}

          {/* Mobile menu — shadcn Sheet */}
          {!searchOpen && (
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
          )}
        </div>
      </Container>
    </header>
  )
}
