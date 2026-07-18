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
