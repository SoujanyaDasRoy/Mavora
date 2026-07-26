export async function recordAuditEvent(
  db: D1Database,
  event: { actorId: string; action: string; articleId?: string }
): Promise<void> {
  await db
    .prepare('INSERT INTO audit_log (id, actor_id, action, article_id) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), event.actorId, event.action, event.articleId ?? null)
    .run()
}

// audit_log (Task 16) has no cleanup mechanism and grows unboundedly. 90
// days is comfortably longer than any realistic need to look back at "who
// changed what" for this app's scale (a small writer team, no compliance
// requirement calling for longer retention) while keeping the table from
// growing forever. Mirrors the existing R2 orphan-cleanup pattern
// (lib/media-cleanup.ts's cleanupOrphanedMedia) and is called from the SAME
// weekly Cron Trigger (workers/scheduled-entry.js) rather than a new one.
export const AUDIT_LOG_RETENTION_DAYS = 90

// Deletes audit_log rows older than `olderThanDays` (default
// AUDIT_LOG_RETENTION_DAYS) and returns how many rows were deleted. Uses
// SQLite's `datetime('now', '-N days')` modifier (bound as a parameter, not
// string-interpolated, to avoid SQL injection even though `olderThanDays` is
// always a caller-controlled number in practice) so the comparison happens
// in D1 rather than pulling every row into the worker first.
export async function deleteOldAuditLogs(
  db: D1Database,
  olderThanDays: number = AUDIT_LOG_RETENTION_DAYS
): Promise<number> {
  const result = await db
    .prepare(`DELETE FROM audit_log WHERE created_at < datetime('now', ?)`)
    .bind(`-${olderThanDays} days`)
    .run()
  return result.meta.changes ?? 0
}

export interface AuditEvent {
  id: string
  actorId: string
  actorName: string | null
  action: string
  articleId: string | null
  articleTitle: string | null
  createdAt: string
}

/**
 * Returns the most recent N audit events joined with writer display names and
 * article titles, so the dashboard's activity feed can render readable rows
 * without N+1 lookups. Resolves actor/article FK misses to NULL — an audit
 * row may outlive its referenced row (e.g. writer deleted, article deleted)
 * and we still want to show the event.
 */
export async function getRecentAuditEvents(
  db: D1Database,
  limit: number = 20
): Promise<AuditEvent[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)))
  const result = await db
    .prepare(
      `SELECT audit_log.id          AS id,
              audit_log.actor_id     AS actor_id,
              audit_log.action       AS action,
              audit_log.article_id   AS article_id,
              audit_log.created_at   AS created_at,
              writers.display_name   AS actor_name,
              articles.title         AS article_title
         FROM audit_log
         LEFT JOIN writers  ON writers.id  = audit_log.actor_id
         LEFT JOIN articles ON articles.id = audit_log.article_id
         ORDER BY audit_log.created_at DESC
         LIMIT ?`
    )
    .bind(safeLimit)
    .all<{
      id: string
      actor_id: string
      action: string
      article_id: string | null
      created_at: string
      actor_name: string | null
      article_title: string | null
    }>()

  return (result.results ?? []).map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    articleId: row.article_id,
    articleTitle: row.article_title,
    createdAt: row.created_at,
  }))
}
