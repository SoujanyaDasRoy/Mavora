// R2's free tier is 10 GiB. This constant exists so the dashboard can show
// usage against that limit (see the plan's Media & Storage Budget math).
export const R2_FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024

/**
 * Sums the size of every object in the media bucket by paginating through
 * `bucket.list()`. A single `list()` call only returns a page of results
 * (up to 1000 objects by default); when the response is `truncated`, the
 * returned `cursor` must be passed back in to fetch the next page. This
 * loop continues until a response comes back with `truncated: false`.
 *
 * `options.pageSize` overrides the page size (R2's `limit` option) and
 * exists only so tests can force multi-page pagination without needing to
 * create hundreds of objects; production callers should omit it and use
 * R2's default page size.
 */
export async function getR2UsedBytes(
  bucket: R2Bucket,
  options?: { pageSize?: number }
): Promise<number> {
  let cursor: string | undefined
  let total = 0

  do {
    const listing = await bucket.list({ cursor, limit: options?.pageSize })
    for (const obj of listing.objects) total += obj.size
    cursor = listing.truncated ? listing.cursor : undefined
  } while (cursor)

  return total
}
