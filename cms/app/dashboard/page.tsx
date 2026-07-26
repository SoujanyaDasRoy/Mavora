'use client'

import { TwoLevelSidebar } from '@/components/ui/sidebar-component'

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#393836]">
      {/* Professional SaaS Sidebar */}
      <TwoLevelSidebar />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-68 min-h-screen bg-[#393836]" />
    </div>
  )
}
