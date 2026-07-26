import { redirect } from 'next/navigation'
import { getDb } from '@/lib/cloudflare'
import { listWritersWithCounts, getWriterLastActivityMap } from '@/lib/writers'
import { requireRole } from '@/lib/role'
import { WritersClient } from './client'

export default async function WritersPage() {
  const guard = await requireRole(['admin'])
  if (guard instanceof Response) redirect('/login')

  const db = getDb()
  const [writers, lastActivity] = await Promise.all([
    listWritersWithCounts(db),
    getWriterLastActivityMap(db),
  ])

  return <WritersClient writers={writers} lastActivity={lastActivity} />
}