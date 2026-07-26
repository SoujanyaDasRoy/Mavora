'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Asleep, Light, Moon, Search, MacCommand, ArrowRight } from '@carbon/icons-react'
import { useTheme, type Theme } from '@/components/theme-provider'
import { MobileSidebar } from '@/components/sidebar'
import type { Role } from '@/lib/writers'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  articles: 'Articles',
  media: 'Media',
  writers: 'Writers',
  settings: 'Settings',
}

function buildCrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }]
  return parts.map((part, i) => {
    const href = '/' + parts.slice(0, i + 1).join('/')
    const label = LABELS[part] ?? (part.length === 36 /* UUID-ish */ ? 'Detail' : part)
    return { label, href }
  })
}

/**
 * Centered command bar. Mimics the Vercel/Stripe search bar — a single
 * pill, keyboard hint on the right, opens a dropdown of quick links on
 * focus. The actual search semantics are stubbed (no global search yet),
 * but the surface looks exactly like the real thing so the visual
 * structure ships first.
 */
function CommandBar() {
  const [open, setOpen] = useState(false)
  const shortcuts = [
    { label: 'New article', href: '/articles/new', hint: 'N' },
    { label: 'Open dashboard', href: '/dashboard', hint: 'G' },
    { label: 'Articles list', href: '/articles', hint: 'A' },
    { label: 'Media library', href: '/media', hint: 'M' },
  ]

  return (
    <div className="relative hidden md:block w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        aria-label="Search"
        className="group flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-fg-muted)',
        }}
      >
        <Search className="size-4 text-[var(--color-fg-subtle)]" />
        <span className="text-[var(--color-fg-subtle)]">Search articles, writers…</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
          <kbd
            className="flex h-5 items-center gap-0.5 rounded border px-1.5"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <MacCommand className="size-3" />
            K
          </kbd>
        </span>
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-40 rounded-md border shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="p-1">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
              >
                <span className="text-[var(--color-fg)]">{s.label}</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
                  <kbd
                    className="flex h-5 items-center rounded border px-1.5"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {s.hint}
                  </kbd>
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ThemePill({ theme, onCycle }: { theme: Theme; onCycle: () => void }) {
  const ICONS: Record<Theme, React.ReactNode> = {
    light: <Light className="size-3.5" />,
    dark: <Moon className="size-3.5" />,
    'dark-oled': <Asleep className="size-3.5" />,
  }
  const NAMES: Record<Theme, string> = {
    light: 'Light',
    dark: 'Dark',
    'dark-oled': 'OLED',
  }
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`Theme: ${NAMES[theme]}. Click to cycle.`}
      className="group inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-fg-muted)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span className="text-[var(--color-fg-subtle)] group-hover:text-[var(--color-fg)]">
        {ICONS[theme]}
      </span>
      <span>{NAMES[theme]}</span>
    </button>
  )
}

function Timestamp() {
  const [stamp, setStamp] = useState<string | null>(null)
  useEffect(() => {
    function tick() {
      const d = new Date()
      const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      setStamp(`${date} · ${time}`)
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span
      className="hidden lg:inline text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)] tabular-nums"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {stamp ?? '—— ——'}
    </span>
  )
}

export function TopBar({ role }: { role: Role }) {
  const pathname = usePathname() ?? ''
  const crumbs = buildCrumbs(pathname)
  const { theme, cycleTheme } = useTheme()

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 md:px-6 backdrop-blur"
      style={{
        backgroundColor: 'var(--color-bg-overlay)',
        borderColor: 'var(--color-border)',
      }}
    >
      <MobileSidebar role={role} />

      <div className="flex flex-1 items-center justify-start">
        <nav className="flex items-center gap-2 text-sm min-w-0">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-2 min-w-0">
              {i > 0 && <span className="text-[var(--color-fg-subtle)]">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-[var(--color-fg)] truncate max-w-[200px]">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] truncate max-w-[200px]"
                >
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-center flex-1">
        <CommandBar />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <Timestamp />
        <ThemePill theme={theme} onCycle={cycleTheme} />
        <UserButton signInUrl="/login" />
      </div>
    </header>
  )
}