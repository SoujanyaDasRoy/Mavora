'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar,
  Dashboard,
  Image as ImageIcon,
  Group,
  Settings,
  Menu,
  SidePanelClose,
  SidePanelOpen,
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

const STORAGE_KEY = 'cms-sidebar-collapsed'

function Nav({
  role,
  pathname,
  collapsed,
  onNavigate,
}: {
  role: Role
  pathname: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1 px-2 py-3">
      {ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={cn(
              'group relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
              collapsed ? 'h-10 justify-center px-0' : 'px-3 py-2',
              active
                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)]'
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--color-accent)]"
              />
            )}
            <span
              className={cn(
                'flex items-center justify-center transition-colors',
                active
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-fg-subtle)] group-hover:text-[var(--color-fg)]'
              )}
            >
              {item.icon}
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Collapsed/expanded brand mark. When collapsed, shows just an "M" tile
 * (rounded square, accent on hover). When expanded, shows "Mavora" + role.
 */
function BrandBlock({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <Link
        href="/dashboard"
        aria-label="Mavora dashboard"
        className="flex items-center justify-center py-4"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-fg)',
          }}
        >
          M
        </span>
      </Link>
    )
  }
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 px-4 py-4"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
        style={{
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
          color: '#fff',
        }}
      >
        M
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight text-[var(--color-fg)]">Mavora</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
          Editorial CMS
        </span>
      </span>
    </Link>
  )
}

/**
 * Collapsible sidebar. Two states: collapsed (64px icon rail, Stripe-style)
 * and expanded (240px with labels). Persists preference to localStorage.
 * The shell queries `useSidebarState()` for the live value so it can
 * offset the content area by the right margin.
 */
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname() ?? ''
  const [collapsed, setCollapsed] = useState(false)

  // Read persisted preference once on mount. The default is expanded
  // (matches the desktop SaaS norm); mobile always uses the Sheet
  // variant instead.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      // ignore
    }
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  const width = collapsed ? 'md:w-16' : 'md:w-60'

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col md:fixed md:inset-y-0 z-30 transition-[width] duration-200',
        width
      )}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
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
        <BrandBlock collapsed={collapsed} />
      </div>
      <ScrollArea className="flex-1">
        <Nav role={role} pathname={pathname} collapsed={collapsed} />
      </ScrollArea>
      <div
        className={cn(
          'flex items-center border-t',
          collapsed ? 'justify-center px-0 py-3' : 'justify-between px-4 py-3',
        )}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)]"
          >
            <SidePanelOpen className="size-4" />
          </button>
        ) : (
          <>
            <span
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span
                className="relative inline-block size-1.5 rounded-full bg-[var(--color-positive)]"
                aria-hidden
              />
              <span>Online</span>
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)]"
            >
              <SidePanelClose className="size-4" />
            </button>
          </>
        )}
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
        <BrandBlock collapsed={false} />
        <Separator />
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <Nav role={role} pathname={pathname} collapsed={false} onNavigate={() => setOpen(false)} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}