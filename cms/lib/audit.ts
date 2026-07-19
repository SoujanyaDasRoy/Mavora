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
