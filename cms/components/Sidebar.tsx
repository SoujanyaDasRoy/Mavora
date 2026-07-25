'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'

/* High-quality thin-stroke icons for business dashboard */
const Icon = {
  grid: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:scale-105">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  external: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
}

type NavItem = { label: string; href: string; icon: React.ReactNode; exact?: boolean }

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Content',
    items: [
      { label: 'All Articles', href: '/articles',        icon: Icon.file },
      { label: 'New Article',  href: '/articles/new',    icon: Icon.plus,  exact: true },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Live Site',      href: 'https://readmavora.vercel.app', icon: Icon.external },
    ],
  },
]

export function SidebarComponent() {
  const pathname = usePathname()
  const { user } = useUser()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <Sidebar className="border-r border-border/80 bg-sidebar text-sidebar-foreground w-60">
      {/* Sidebar Header with official Mavora logo */}
      <SidebarHeader className="border-b border-border/60 py-5 px-6 flex items-center justify-start">
        <Link href="/articles" className="flex items-center">
          <img
            src="/logo.png"
            alt="Mavora Logo"
            className="w-[125px] h-auto object-contain brightness-0 invert opacity-95 hover:opacity-100 transition-opacity"
          />
        </Link>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="py-6 px-3">
        {SECTIONS.map((section) => (
          <SidebarGroup key={section.label} className="mb-6 p-0">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold tracking-[0.12em] text-muted-foreground/60 uppercase mb-2">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const external = item.href.startsWith('http')
                  const active = !external && isActive(item.href, item.exact)
                  return (
                    <SidebarMenuItem key={item.label} className="mb-0.5">
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                          active
                            ? 'bg-secondary text-primary font-semibold border-l-2 border-primary rounded-l-none'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <span className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Sidebar Footer with user profile */}
      <SidebarFooter className="border-t border-border/60 p-4 flex flex-row items-center gap-3">
        <div className="flex items-center gap-2.5 w-full">
          <UserButton />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate leading-tight">
              {user?.firstName || user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'Writer'}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Admin · Mavora</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
