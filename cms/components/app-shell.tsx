import type { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/topbar'
import type { Role } from '@/lib/writers'

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar role={role} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <TopBar role={role} />
        <main className="flex-1 px-4 md:px-6 py-6 md:py-8 relative z-10">{children}</main>
      </div>
    </div>
  )
}