/**
 * Objects younger than this are never deleted, no matter how the `known`
 * snapshot below compares to them. Closes a TOCTOU race: `known` is a single
 * upfront read of `media.r2_key`, taken before this function starts
 * paginating R2. `app/api/media/upload/route.ts` does `uploadToR2()` then
 * `recordMedia()` as two separate, non-transactional steps, so an object
 * whose R2 upload lands *after* the snapshot above but whose `media` row
 * hasn't committed *yet* would look orphaned to this pass even though it's a
 * legitimate, just-uploaded image. Skipping anything younger than the grace
 * period means such an object always survives the pass it raced with; it's
 * only reconsidered on the next scheduled run (see workers/scheduled-entry.js
 * -- weekly), by which point its `media` row has either landed (kept) or it's
 * genuinely abandoned (deleted). 15 minutes is comfortably longer than any
 * realistic upload-to-D1-commit gap.
 */
const DEFAULT_GRACE_PERIOD_MS = 15 * 60 * 1000

/**
 * Deletes every object in the media bucket that has no corresponding
 * `media.r2_key` row in D1 ("orphans" -- e.g. an upload whose article was
 * deleted, or a request that uploaded to R2 but failed before the D1 insert
 * committed) AND is older than the grace period, and returns how many
 * objects were deleted.
 *
 * Follows the exact same `bucket.list()` pagination pattern as
 * `getR2UsedBytes` (lib/stats.ts, reviewed/hardened by Task 14): a single
 * `list()` call only returns a page of results (up to 1000 objects by
 * default); when the response is `truncated`, the returned `cursor` must be
 * passed back in to fetch the next page. The loop continues until a
 * response comes back with `truncated: false`.
 *
 * `options.pageSize` overrides the page size (R2's `limit` option) and
 * exists only so tests can force multi-page pagination without needing to
 * create hundreds of objects; production callers should omit it and use
 * R2's default page size.
 *
 * `options.gracePeriodMs` overrides `DEFAULT_GRACE_PERIOD_MS` and exists
 * only so tests can use a millisecond-scale grace window instead of waiting
 * out the real 15-minute one; production callers should omit it.
 */
export async function cleanupOrphanedMedia(
  db: D1Database,
  bucket: R2Bucket,
  options?: { pageSize?: number; gracePeriodMs?: number }
): Promise<number> {
  const knownKeys = new Set(
    (await db.prepare('SELECT r2_key FROM media').all()).results.map(
      (row) => (row as { r2_key: string }).r2_key
    )
  )
  const gracePeriodMs = options?.gracePeriodMs ?? DEFAULT_GRACE_PERIOD_MS

  let cursor: string | undefined
  let deleted = 0
  do {
    const listing = await bucket.list({ cursor, limit: options?.pageSize })
    for (const obj of listing.objects) {
      const ageMs = Date.now() - obj.uploaded.getTime()
      if (!knownKeys.has(obj.key) && ageMs >= gracePeriodMs) {
        await bucket.delete(obj.key)
        deleted += 1
      }
    }
    cursor = listing.truncated ? listing.cursor : undefined
  } while (cursor)

  return deleted
}
