'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export function AdminHeader() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  return (
    <header className="admin-header">
      <div className="header-container">
        <div className="header-left">
          <Link href="/articles" className="brand-logo">
            Mavora <span className="cms-badge">CMS</span>
          </Link>
          <nav className="nav-links">
            <Link
              href="/articles"
              className={`nav-link ${isActive('/articles') ? 'active' : ''}`}
            >
              Articles
            </Link>
            <Link
              href="/articles"
              className={`nav-link ${isActive('/articles') ? 'active' : ''}`}
            >
              Articles
            </Link>
          </nav>
        </div>

        <div className="header-right">
          <Link
            href="/articles/new"
            className="btn btn-ghost btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
            New Article
          </Link>
          <UserButton />
        </div>
      </div>
    </header>
  )
}
