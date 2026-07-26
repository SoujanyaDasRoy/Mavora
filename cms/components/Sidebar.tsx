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
    <nav className="flex flex-col gap-1 px-3 py-4">
      {ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)]'
            )}
          >
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

function BrandBlock() {
  return (
    <Link href="/dashboard" className="flex items-center px-5 py-4 group">
      <img
        src="/logo.png"
        alt="Mavora Logo"
        className="h-8 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
      />
    </Link>
  )
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname() ?? ''

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col md:border-r md:fixed md:inset-y-0 z-30"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <BrandBlock />
      <Separator />
      <ScrollArea className="flex-1">
        <Nav role={role} pathname={pathname} />
      </ScrollArea>
      <div className="px-5 py-3 text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
        v0.1.0 · {role}
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