'use client'

import { TwoLevelSidebar } from '@/components/ui/sidebar-component'

export default function ArticlesPage() {
  return (
    <div className="flex min-h-screen bg-[#393836]">
      {/* Fixed 288px Sidebar */}
      <TwoLevelSidebar />

      {/* Main Partition */}
      <main className="flex-1 md:pl-72 min-h-screen bg-[#393836]" />
    </div>
  )
}
