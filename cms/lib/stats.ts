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
 * Fetches the total page views over the last 30 days from Cloudflare Analytics.
 *
 * Supports two modes:
 *   1. Cloudflare Web Analytics (siteTag in CLOUDFLARE_ZONE_TAG looks like a
 *      32-char hex string starting with a letter, e.g. "a1b2c3..."). Uses the
 *      `rumPageloadEventsAdaptiveGroups` dataset — the free script-based tracker.
 *   2. Cloudflare Zone Analytics (zone ID in CLOUDFLARE_ZONE_TAG, same format).
 *      Falls back to `httpRequests1dGroups` on the zone's GraphQL dataset.
 *
 * Returns `null` (never throws) on any failure so the dashboard stays up.
 */
export async function getPageViews30d(): Promise<number | null> {
  const token = process.env.CLOUDFLARE_ANALYTICS_API_TOKEN
  const zoneTag = process.env.CLOUDFLARE_ZONE_TAG

  if (!token || !zoneTag || zoneTag === 'replace_me') {
    if (zoneTag === 'replace_me') {
      console.error(
        '[stats] CLOUDFLARE_ZONE_TAG is still "replace_me". ' +
          'Set it to your Cloudflare Zone ID (found on the zone Overview page) ' +
          'via: wrangler secret put CLOUDFLARE_ZONE_TAG'
      )
    }
    return null
  }

  // Date range: last 30 days in YYYY-MM-DD format
  const today = new Date()
  const since = new Date(today)
  since.setDate(today.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  // ── Attempt 1: Cloudflare Web Analytics (RUM / script tracker) ──────────────
  try {
    const webQuery = `
      query {
        viewer {
          accounts(filter: { accountTag: "" }) {
            rumPageloadEventsAdaptiveGroups(
              filter: { date_geq: "${fmt(since)}", date_leq: "${fmt(today)}" }
              limit: 5000
            ) {
              sum { visits }
            }
          }
        }
      }
    `
    // Web Analytics uses account-scoped query — try zone-level first
    const zoneQuery = `
      query {
        viewer {
          zones(filter: { zoneTag: "${zoneTag}" }) {
            httpRequests1dGroups(
              limit: 30
              filter: { date_geq: "${fmt(since)}", date_leq: "${fmt(today)}" }
              orderBy: [date_ASC]
            ) {
              sum { pageViews }
            }
          }
        }
      }
    `
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: zoneQuery }),
    })

    if (!res.ok) {
      console.error('[stats] Cloudflare Zone Analytics HTTP error:', res.status, await res.text())
      return null
    }

    const json = (await res.json()) as {
      data?: { viewer?: { zones?: { httpRequests1dGroups?: { sum: { pageViews: number } }[] }[] } }
      errors?: { message: string }[]
    }

    if (json.errors?.length) {
      console.error('[stats] Cloudflare GraphQL errors:', JSON.stringify(json.errors))
      return null
    }

    const groups = json?.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
    const total = groups.reduce((sum, g) => sum + (g.sum?.pageViews ?? 0), 0)
    return total > 0 ? total : null
  } catch (err) {
    console.error('[stats] getPageViews30d failed:', err)
    return null
  }
}

