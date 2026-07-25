'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, FileText, PlusCircle, Globe, Menu, X
} from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'

export function TwoLevelSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'All Articles',
      href: '/articles',
      icon: FileText,
    },
    {
      label: 'New Article',
      href: '/articles/new',
      icon: PlusCircle,
    },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white shadow-md cursor-pointer"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-4 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 px-2 pt-2 pb-4 border-b border-zinc-800/60">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                Mavora
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-1">
                CMS Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* System Links */}
          <div className="space-y-1 pt-4 border-t border-zinc-900">
            <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Quick Links
            </div>
            <a
              href="https://readmavora.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
            >
              <Globe className="h-4 w-4 text-zinc-500" />
              Live Reader Site
            </a>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3 px-2">
          <UserButton />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">
              {user?.fullName || user?.firstName || 'User'}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {user?.primaryEmailAddress?.emailAddress || 'Admin'}
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
