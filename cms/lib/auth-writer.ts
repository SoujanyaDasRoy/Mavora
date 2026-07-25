import { auth, currentUser } from '@clerk/nextjs/server'
import { getWriter, type Writer } from './writers'

export async function getOrCreateCurrentWriter(db: D1Database): Promise<Writer | null> {
  const { userId } = await auth()
  if (!userId) return null

  let writer = await getWriter(db, userId)
  if (writer) return writer

  const user = await currentUser()
  if (!user) return null

  // Check if writers table is empty to promote first user to admin
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM writers').first<{ count: number }>()
  const isFirst = !countResult || countResult.count === 0
  const role = isFirst ? 'admin' : 'writer'
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.emailAddresses[0]?.emailAddress || 'Writer'

  await db
    .prepare('INSERT INTO writers (id, role, display_name) VALUES (?, ?, ?)')
    .bind(userId, role, displayName)
    .run()

  return getWriter(db, userId)
}
