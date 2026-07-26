export type Role = 'admin' | 'writer'

export interface Writer {
  id: string
  role: Role
  displayName: string
  createdAt: string
}

function rowToWriter(row: any): Writer {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

export async function getWriter(db: D1Database, clerkUserId: string): Promise<Writer | null> {
  const row = await db.prepare('SELECT * FROM writers WHERE id = ?').bind(clerkUserId).first()
  return row ? rowToWriter(row) : null
}

export async function getOrCreateWriter(
  db: D1Database,
  clerkUserId: string,
  displayName: string
): Promise<Writer> {
  const existing = await getWriter(db, clerkUserId)
  if (existing) return existing

  await db
    .prepare('INSERT INTO writers (id, role, display_name) VALUES (?, ?, ?)')
    .bind(clerkUserId, 'writer', displayName)
    .run()

  const created = await getWriter(db, clerkUserId)
  if (!created) throw new Error(`Failed to create writer ${clerkUserId}`)
  return created
}

export interface WriterWithCounts extends Writer {
  articleCount: number
  publishedCount: number
}

/**
 * Admin-only listing of every writer with article counts. One SQL aggregates
 * both totals via LEFT JOIN + SUM(CASE) so we don't issue 2N queries. The
 * LEFT JOIN means writers with zero articles still appear (with zero counts),
 * which is what the new-invite confirmation flow on /writers expects.
 */
export async function listWritersWithCounts(db: D1Database): Promise<WriterWithCounts[]> {
  const result = await db
    .prepare(
      `SELECT writers.id          AS id,
              writers.role        AS role,
              writers.display_name AS display_name,
              writers.created_at  AS created_at,
              COUNT(articles.id)  AS article_count,
              SUM(CASE WHEN articles.status = 'published' THEN 1 ELSE 0 END) AS published_count
         FROM writers
         LEFT JOIN articles ON articles.author_id = writers.id
         GROUP BY writers.id
         ORDER BY writers.created_at ASC`
    )
    .all<{
      id: string
      role: Role
      display_name: string
      created_at: string
      article_count: number
      published_count: number
    }>()

  return (result.results ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    createdAt: row.created_at,
    articleCount: row.article_count ?? 0,
    publishedCount: row.published_count ?? 0,
  }))
}

/** Timestamp of the writer's last audit_log entry — drives "last activity" column. */
export async function getWriterLastActivityMap(
  db: D1Database
): Promise<Record<string, string>> {
  const result = await db
    .prepare(
      `SELECT actor_id AS actor_id, MAX(created_at) AS last_at
         FROM audit_log
         WHERE actor_id IS NOT NULL
         GROUP BY actor_id`
    )
    .all<{ actor_id: string; last_at: string }>()

  const out: Record<string, string> = {}
  for (const row of result.results ?? []) {
    out[row.actor_id] = row.last_at
  }
  return out
}
