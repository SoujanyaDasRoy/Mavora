/**
 * Deletes every object in the media bucket that has no corresponding
 * `media.r2_key` row in D1 ("orphans" -- e.g. an upload whose article was
 * deleted, or a request that uploaded to R2 but failed before the D1 insert
 * committed), and returns how many objects were deleted.
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
 */
export async function cleanupOrphanedMedia(
  db: D1Database,
  bucket: R2Bucket,
  options?: { pageSize?: number }
): Promise<number> {
  const knownKeys = new Set(
    (await db.prepare('SELECT r2_key FROM media').all()).results.map(
      (row) => (row as { r2_key: string }).r2_key
    )
  )

  let cursor: string | undefined
  let deleted = 0
  do {
    const listing = await bucket.list({ cursor, limit: options?.pageSize })
    for (const obj of listing.objects) {
      if (!knownKeys.has(obj.key)) {
        await bucket.delete(obj.key)
        deleted += 1
      }
    }
    cursor = listing.truncated ? listing.cursor : undefined
  } while (cursor)

  return deleted
}
