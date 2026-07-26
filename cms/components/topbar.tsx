'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Asleep, Light, Moon } from '@carbon/icons-react'
import { useTheme, type Theme } from '@/components/theme-provider'
import { MobileSidebar } from '@/components/Sidebar'
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
 * Single theme-toggle pill. Reads as a labeled instrument knob rather than
 * a bare icon button — the label tells the user which mode they're in and
 * what the next click will do. Three states cycle Light → Dark → OLED.
 */
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
      className="group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors"
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

/**
 * Server-rendered stamp that fills in on the client. Shown in mono caps so
 * it reads like a console timestamp next to the breadcrumb — quiet but
 * precise.
 */
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
      {stamp ?? '— —'}
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

      <nav className="hidden md:flex items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-[var(--color-fg-subtle)]">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-[var(--color-fg)]">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <Timestamp />
        <ThemePill theme={theme} onCycle={cycleTheme} />
        <UserButton signInUrl="/login" />
      </div>
    </header>
  )
}