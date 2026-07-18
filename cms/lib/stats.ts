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

/**
 * Fetches the current newsletter subscriber count from Buttondown. Returns
 * `null` (never throws) when `BUTTONDOWN_API_KEY` is unset, the request
 * fails, or the response is a non-2xx status, so a Buttondown outage doesn't
 * take down the whole Dashboard.
 */
export async function getSubscriberCount(): Promise<number | null> {
  const apiKey = process.env.BUTTONDOWN_API_KEY
  if (!apiKey) return null
  try {
    const response = await fetch('https://api.buttondown.com/v1/subscribers?type=regular', {
      headers: { Authorization: `Token ${apiKey}` },
    })
    if (!response.ok) return null
    const data = (await response.json()) as { count: number }
    return data.count
  } catch {
    return null
  }
}

/**
 * Fetches the total page views over the last 30 days from Cloudflare Web
 * Analytics via the GraphQL Analytics API. Returns `null` (never throws)
 * when the required env vars are unset, the request fails, or the response
 * is a non-2xx status, so a Cloudflare Analytics outage doesn't take down
 * the whole Dashboard.
 */
export async function getPageViews30d(): Promise<number | null> {
  const token = process.env.CLOUDFLARE_ANALYTICS_API_TOKEN
  const zoneTag = process.env.CLOUDFLARE_ZONE_TAG
  if (!token || !zoneTag) return null
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { viewer { zones(filter: { zoneTag: "${zoneTag}" }) { httpRequests1dGroups(limit: 30) { sum { pageViews } } } } }`,
      }),
    })
    if (!response.ok) return null
    const data = (await response.json()) as any
    const groups = data?.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
    return groups.reduce((sum: number, g: any) => sum + (g.sum?.pageViews ?? 0), 0)
  } catch {
    return null
  }
}
