import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { cleanupOrphanedMedia } from '@/lib/media-cleanup'

// Gated by Clerk auth via `/api/cron(.*)` in `isProtectedRoute`
// (middleware.ts) -- an unauthenticated caller gets redirected/rejected by
// `auth.protect()` before this handler ever runs. That auth gate costs
// production nothing: the real Cron Trigger invocation never reaches this
// HTTP route at all -- see workers/scheduled-entry.js, which Cloudflare's
// Cron Trigger actually calls directly, bypassing Next.js routing and this
// middleware entirely. This route exists for the TDD test below and for
// manual/ops triggering of the same cleanup.
//
// Auth is defense-in-depth, not the only protection: `cleanupOrphanedMedia`
// (lib/media-cleanup.ts) also skips any R2 object younger than a ~15-minute
// grace period, regardless of caller. That closes a real TOCTOU race --
// `app/api/media/upload/route.ts` uploads to R2 and records the `media` row
// as two separate, non-transactional steps, so an object uploaded during a
// cleanup pass could otherwise look orphaned before its row commits and get
// deleted out from under a legitimate, in-flight upload. See the Task 17
// report for the full reasoning.
export async function GET(): Promise<Response> {
  const deleted = await cleanupOrphanedMedia(getDb(), getMediaBucket())
  return new Response(JSON.stringify({ deleted }), { status: 200 })
}
