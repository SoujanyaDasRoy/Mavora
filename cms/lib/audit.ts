export async function recordAuditEvent(
  db: D1Database,
  event: { actorId: string; action: string; articleId?: string }
): Promise<void> {
  await db
    .prepare('INSERT INTO audit_log (id, actor_id, action, article_id) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), event.actorId, event.action, event.articleId ?? null)
    .run()
}
