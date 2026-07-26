import { auth } from '@clerk/nextjs/server'
import type { NextResponse } from 'next/server'
import { getDb } from './cloudflare'
import { getWriter, type Role, type Writer } from './writers'

export type RoleResult = { writer: Writer; userId: string } | NextResponse

/**
 * Server-side role guard for pages and route handlers.
 *
 * Resolves the current Clerk session → D1 writer row, then enforces an
 * allow-list of roles. On any failure (no session, writer row missing,
 * role not allowed) returns a `Response` the caller can `return` directly:
 *
 *   const guard = await requireRole(['admin', 'writer'])
 *   if (guard instanceof Response) return guard
 *   const { writer } = guard
 *
 * Pages call this and, on a `Response`, should `notFound()` or `redirect()`
 * based on the status; route handlers should `return guard`.
 */
export async function requireRole(allowed: Role[]): Promise<RoleResult> {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 }) as NextResponse
  }

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) {
    return new Response('Forbidden', { status: 403 }) as NextResponse
  }

  if (!allowed.includes(writer.role)) {
    return new Response('Forbidden', { status: 403 }) as NextResponse
  }

  return { writer, userId }
}

/**
 * Lightweight version that returns `null` instead of a `Response` on
 * failure. Useful for layouts that want to render different shells based
 * on role (e.g. admin sidebar) without short-circuiting the page render.
 */
export async function getCurrentWriter(): Promise<{ writer: Writer; userId: string } | null> {
  const { userId } = await auth()
  if (!userId) return null

  const writer = await getWriter(getDb(), userId)
  if (!writer) return null

  return { writer, userId }
}