'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Globe, 
  Search, 
  ChevronDown, 
  HardDrive,
  Menu, 
  X,
  Sparkles
} from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'

export function TwoLevelSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

      {/* Kevin Dukkon Financial Dashboard Sidebar — Fixed 288px Width Column */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#302F2D] border-r border-[#4A4846] flex flex-col justify-between p-6 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          
          {/* Header & Workspace Switcher */}
          <div className="pb-5 border-b border-[#4A4846]/70">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#cf2743] to-[#9e1b30] flex items-center justify-center font-extrabold text-white text-xl shadow-md shadow-[#cf2743]/20 shrink-0">
                M
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-white tracking-tight leading-snug truncate">
                    Mavora
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#cf2743]/20 text-[#cf2743] text-[9px] font-bold uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <button className="flex items-center gap-1 text-[11px] font-medium text-[#b0b0b0] hover:text-white mt-0.5 transition text-left cursor-pointer truncate">
                  <span className="truncate">Production CMS</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#b0b0b0] pointer-events-none" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#393836] border border-[#4A4846] text-xs text-white placeholder-[#b0b0b0] focus:outline-none focus:border-[#cf2743] transition leading-normal"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-[#4A4846]/60 text-[10px] font-mono text-[#b0b0b0] pointer-events-none">
              ⌘K
            </kbd>
          </div>

          {/* Navigation Section 1: GENERAL */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-[#b0b0b0] uppercase tracking-widest">
              General
            </div>
            
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/dashboard')
                  ? 'bg-[#cf2743] text-white font-bold shadow-md shadow-[#cf2743]/20'
                  : 'text-[#f0f0f0]/80 hover:text-white hover:bg-[#393836]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`h-4 w-4 ${isActive('/dashboard') ? 'text-white' : 'text-[#b0b0b0]'}`} />
                <span>Dashboard</span>
              </div>
              {isActive('/dashboard') && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </Link>

            <Link
              href="/articles"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/articles')
                  ? 'bg-[#cf2743] text-white font-bold shadow-md shadow-[#cf2743]/20'
                  : 'text-[#f0f0f0]/80 hover:text-white hover:bg-[#393836]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`h-4 w-4 ${isActive('/articles') ? 'text-white' : 'text-[#b0b0b0]'}`} />
                <span>Articles</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#393836] text-[10px] font-bold text-[#b0b0b0] border border-[#4A4846]">
                All
              </span>
            </Link>

            <Link
              href="/articles/new"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive('/articles/new')
                  ? 'bg-[#cf2743] text-white font-bold shadow-md shadow-[#cf2743]/20'
                  : 'text-[#f0f0f0]/80 hover:text-white hover:bg-[#393836]'
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle className={`h-4 w-4 ${isActive('/articles/new') ? 'text-white' : 'text-[#b0b0b0]'}`} />
                <span>New Article</span>
              </div>
            </Link>
          </div>

          {/* Navigation Section 2: MANAGEMENT */}
          <div className="space-y-1 pt-2">
            <div className="px-3 pb-2 text-[10px] font-bold text-[#b0b0b0] uppercase tracking-widest">
              Management
            </div>

            <a
              href="https://readmavora.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#f0f0f0]/80 hover:text-white hover:bg-[#393836] transition"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-[#b0b0b0]" />
                <span>Live Reader Site</span>
              </div>
              <span className="text-[10px] text-[#b0b0b0]">↗</span>
            </a>
          </div>

          {/* Sidebar Bottom Pro / Storage Widget */}
          <div className="p-4 rounded-2xl bg-[#393836] border border-[#4A4846] space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-[#cf2743] shrink-0" />
                <span className="text-xs font-bold text-white">Storage</span>
              </div>
              <span className="text-[10px] font-semibold text-[#b0b0b0]">0.4 GB / 10 GB</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#4A4846] overflow-hidden">
              <div className="h-full bg-[#cf2743] rounded-full w-[4%]" />
            </div>
            <button className="w-full h-9 rounded-xl bg-[#302F2D] hover:bg-[#272624] border border-[#4A4846] text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer">
              <Sparkles className="h-3.5 w-3.5 text-[#cf2743]" />
              Manage Plan
            </button>
          </div>

        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-[#4A4846]/70 flex items-center justify-between px-1">
          <div className="flex items-center gap-3 min-w-0">
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
        </div>
      </aside>
    </>
  )
}
