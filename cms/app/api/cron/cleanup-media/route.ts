import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { cleanupOrphanedMedia } from '@/lib/media-cleanup'

// Not gated by Clerk auth or the CSRF origin check (see middleware.ts --
// `/api/cron` isn't in `isProtectedRoute`, and GET is a CSRF-safe method).
// That's intentional: the real Cron Trigger invocation never reaches this
// HTTP route at all -- see workers/scheduled-entry.js, which Cloudflare's
// Cron Trigger actually calls -- so there's no authenticated caller to
// gate. This route exists for the TDD test below and for manual/ops
// triggering of the same cleanup. Worst case if hit directly, it can only
// delete objects that already have no matching `media` row, so exposure is
// low; see the Task 17 report for the full reasoning.
export async function GET(): Promise<Response> {
  const deleted = await cleanupOrphanedMedia(getDb(), getMediaBucket())
  return new Response(JSON.stringify({ deleted }), { status: 200 })
}
