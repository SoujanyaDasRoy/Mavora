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
          className="p-2.5 rounded-xl bg-[#302F2D] border border-[#4A4846] text-white shadow-md cursor-pointer"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 25% Sidebar Partition Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-4/5 md:w-1/4 bg-[#302F2D] border-r border-[#4A4846] flex flex-col justify-between p-6 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-[#4A4846]/80">
            <div className="h-9 w-9 rounded-xl bg-[#cf2743] flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-[#cf2743]/30">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-tight leading-none">
                Mavora
              </span>
              <span className="text-[10px] font-bold text-[#cf2743] uppercase tracking-widest mt-1">
                CMS Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold text-[#b0b0b0] uppercase tracking-widest">
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
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#cf2743] text-white shadow-md shadow-[#cf2743]/20 font-bold'
                      : 'text-[#f0f0f0]/80 hover:text-white hover:bg-[#393836]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-[#b0b0b0]'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Quick Links */}
          <div className="space-y-1.5 pt-6 border-t border-[#4A4846]/60">
            <div className="px-3 pb-2 text-[10px] font-bold text-[#b0b0b0] uppercase tracking-widest">
              Live Site
            </div>
            <a
              href="https://readmavora.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold text-[#f0f0f0]/80 hover:text-white hover:bg-[#393836] transition"
            >
              <Globe className="h-4 w-4 text-[#b0b0b0]" />
              View Frontend Site ↗
            </a>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="pt-6 border-t border-[#4A4846]/80 flex items-center gap-3 px-1">
          <UserButton />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">
              {user?.fullName || user?.firstName || 'User'}
            </span>
            <span className="text-[10px] text-[#b0b0b0] truncate">
              {user?.primaryEmailAddress?.emailAddress || 'Admin'}
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
