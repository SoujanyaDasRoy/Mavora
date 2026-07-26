"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export function TwoLevelSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [openSection, setOpenSection] = useState<'articles' | 'none'>('none')

  return (
    <aside
      className={`h-screen transition-all bg-white/5 border-r border-white/6 p-4 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-6">
        <Link href="/cms">
          <a className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-pink-500 to-amber-400 flex items-center justify-center text-white font-bold">M</div>
            {!collapsed && <span className="font-semibold">Mavora CMS</span>}
          </a>
        </Link>

        <Button variant="ghost" size="sm" onClick={() => setCollapsed((s) => !s)}>
          {collapsed ? '>' : '<'}
        </Button>
      </div>

      <nav className="flex-1 space-y-3">
        <Link href="/cms/dashboard">
          <a className="flex items-center justify-between p-2 rounded-md hover:bg-white/3">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {!collapsed && <span>Dashboard</span>}
            </div>
            {!collapsed && <Badge>New</Badge>}
          </a>
        </Link>

        <div>
          <button
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-white/3"
            onClick={() => setOpenSection((s) => (s === 'articles' ? 'none' : 'articles'))}
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {!collapsed && <span>Articles</span>}
            </div>
            {!collapsed && (
              <span className="text-sm text-muted-foreground">{openSection === 'articles' ? '▾' : '▸'}</span>
            )}
          </button>

          {!collapsed && openSection === 'articles' && (
            <div className="mt-2 ml-8 flex flex-col gap-1">
              <Link href="/cms/articles">
                <a className="p-2 rounded-md hover:bg-white/3">All Articles</a>
              </Link>
              <Link href="/cms/articles/new">
                <a className="p-2 rounded-md hover:bg-white/3">Create</a>
              </Link>
            </div>
          )}
        </div>

        <Link href="/cms/settings">
          <a className="flex items-center p-2 rounded-md hover:bg-white/3 gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 17.8l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.67 0 1.2-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.3 5.3A2 2 0 1 1 7.13 2.47l.06.06c.45.45 1.04.68 1.65.68h.05c.6 0 1.2-.23 1.65-.68l.06-.06A2 2 0 1 1 14.7 4.3l-.06.06c-.45.45-.68 1.04-.68 1.65v.05c0 .61.23 1.2.68 1.65l.06.06A2 2 0 1 1 19.4 7.13l-.06.06c-.45.45-.68 1.04-.68 1.65v.05c0 .61.23 1.2.68 1.65l.06.06A2 2 0 0 1 19.4 15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Settings</span>
          </a>
        </Link>
      </nav>

      <Separator className="my-4" />

      <div className="text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10" />
          {!collapsed && <div>
            <div className="font-medium">Admin</div>
            <div className="text-xs text-muted-foreground">admin@mavora.test</div>
          </div>}
        </div>
      </div>
    </aside>
  )
}

export default TwoLevelSidebar
