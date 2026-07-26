'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Asleep, Light, Moon } from '@carbon/icons-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
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

function ThemeIcon({ theme }: { theme: 'light' | 'dark' | 'dark-oled' }) {
  if (theme === 'light') return <Light className="size-4" />
  if (theme === 'dark') return <Moon className="size-4" />
  return <Asleep className="size-4" />
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

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${theme}. Click to cycle.`}
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon theme={theme} />
        </Button>
        <UserButton signInUrl="/login" />
      </div>
    </header>
  )
}