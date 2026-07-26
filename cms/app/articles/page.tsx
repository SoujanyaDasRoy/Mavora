'use client'

import { TwoLevelSidebar } from '@/components/ui/sidebar-component'

export default function ArticlesPage() {
  return (
    <div className="flex min-h-screen bg-[#393836]">
      {/* 25% Empty Sidebar Partition */}
      <TwoLevelSidebar />

      {/* 75% Empty Main Partition */}
      <main className="w-full md:w-3/4 md:ml-[25%] min-h-screen bg-[#393836]" />
    </div>
  )
}
