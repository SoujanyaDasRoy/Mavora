'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar,
  Dashboard,
  Image as ImageIcon,
  Group,
  Settings,
  Menu,
} from '@carbon/icons-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/writers'

export interface SidebarItem {
  label: string
  href: string
  icon: ReactNode
  /** Roles that may see this item. Omit → visible to all roles. */
  roles?: Role[]
}

const ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Dashboard className="size-5" /> },
  { label: 'Articles', href: '/articles', icon: <ChartBar className="size-5" /> },
  { label: 'Media', href: '/media', icon: <ImageIcon className="size-5" /> },
  { label: 'Writers', href: '/writers', icon: <Group className="size-5" />, roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: <Settings className="size-5" /> },
]

function Nav({ role, pathname, onNavigate }: { role: Role; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      {ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)]'
            )}
          >
            {/* Active rail — a single 2px amber tick on the left edge. The
             * only place the accent color appears in the sidebar; everything
             * else stays monochrome so the active state reads instantly. */}
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[var(--color-accent)]"
              />
            )}
            <span
              className={cn(
                'flex items-center justify-center transition-colors',
                active ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-subtle)] group-hover:text-[var(--color-fg)]'
              )}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Wordmark, not a logo image. The display serif (Newsreader) gives the
 * sidebar a publishing imprint rather than a SaaS look. Sits inside its
 * own recessed plate so the wordmark reads as a masthead, not a label.
 */
function BrandBlock() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 px-5 py-5 group"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <span className="relative inline-block size-2 rounded-full bg-[var(--color-accent)] vu-dot" aria-hidden />
      <span className="text-xl font-medium tracking-tight text-[var(--color-fg)]">
        Mavora
      </span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)] ml-auto">
        CMS
      </span>
    </Link>
  )
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname() ?? ''

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30"
      style={{
        // Recessed — one step darker than the page so the sidebar reads as
        // a tray the workspace sits inside, not a panel.
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="border-b"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <BrandBlock />
      </div>
      <ScrollArea className="flex-1">
        <Nav role={role} pathname={pathname} />
      </ScrollArea>
      <div
        className="flex items-center justify-between border-t px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>v0.1 · {role}</span>
        <span className="flex items-center gap-1.5">
          <span className="relative inline-block size-1.5 rounded-full bg-[var(--color-positive)]" aria-hidden />
          <span>Online</span>
        </span>
      </div>
    </aside>
  )
}

export function MobileSidebar({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ''

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)]"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-64"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <BrandBlock />
        <Separator />
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <Nav role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}