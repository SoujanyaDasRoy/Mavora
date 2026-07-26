import { redirect } from 'next/navigation'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { listArticles } from '@/lib/articles'
import { getRecentAuditEvents, type AuditEvent } from '@/lib/audit'
import {
  getR2UsedBytes,
  getSubscriberCount,
  getPageViews30d,
  R2_FREE_TIER_BYTES,
} from '@/lib/stats'
import { buildMockSeries } from '@/lib/series'
import { requireRole } from '@/lib/role'
import { DashboardClient } from './client'

export default async function DashboardPage() {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) redirect('/login')

  const db = getDb()
  const writer = guard.writer

  const [articles, events, r2UsedBytes, subscriberCount, pageViews30d] = await Promise.all([
    listArticles(db, writer.role === 'admin' ? {} : { authorId: writer.id }),
    writer.role === 'admin' ? getRecentAuditEvents(db, 12) : Promise.resolve([] as AuditEvent[]),
    getR2UsedBytes(getMediaBucket()),
    getSubscriberCount(),
    getPageViews30d(),
  ])

  const draftCount = articles.filter((a) => a.status === 'draft').length
  const publishedCount = articles.filter((a) => a.status === 'published').length

  // Single source of mock series so the KPI sparklines and the larger
  // "page views" chart below share the same shape — they only differ
  // in column/variant.
  const pageViewsSeries = buildMockSeries('pageviews-30d', 30, Math.max(1, pageViews30d ?? 0) / 30, 25)
  const subscriberSeries = buildMockSeries('subscribers-30d', 30, Math.max(1, subscriberCount ?? 0) / 30, 4)
  const draftsSeries = buildMockSeries('drafts-30d', 30, Math.max(1, draftCount) / 30, 0.6)
  const publishedSeries = buildMockSeries('published-30d', 30, Math.max(1, publishedCount) / 30, 0.6)

  return (
    <DashboardClient
      role={writer.role}
      displayName={writer.displayName}
      draftCount={draftCount}
      publishedCount={publishedCount}
      subscriberCount={subscriberCount}
      pageViews30d={pageViews30d}
      r2UsedBytes={r2UsedBytes}
      r2FreeTierBytes={R2_FREE_TIER_BYTES}
      events={events}
      pageViewsSeries={pageViewsSeries}
      subscriberSeries={subscriberSeries}
      draftsSeries={draftsSeries}
      publishedSeries={publishedSeries}
    />
  )
}