'use client'

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/components/DashboardStats'
import { InviteWriterForm } from '@/components/InviteWriterForm'

interface Stats {
  draftCount: number
  publishedCount: number
  r2UsedBytes: number
  r2FreeTierBytes: number
  subscriberCount: number | null
  pageViews30d: number | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      setLoadError(false)
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          setLoadError(true)
          return
        }
        const data = (await response.json()) as Stats
        setStats(data)
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <main>
      <h1>Dashboard</h1>
      {loading && <p>Loading...</p>}
      {loadError && <p>Failed to load stats.</p>}
      {stats && <DashboardStats stats={stats} />}
      <InviteWriterForm />
    </main>
  )
}
