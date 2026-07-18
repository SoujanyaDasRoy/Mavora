export const MAX_IMAGE_BYTES = 800 * 1024
export const MAX_MEDIA_PER_ARTICLE = 6

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateUpload(
  file: { type: string; size: number },
  existingCount: number
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_IMAGE_BYTES} byte limit` }
  }
  if (existingCount >= MAX_MEDIA_PER_ARTICLE) {
    return { valid: false, error: `Article already has the maximum of ${MAX_MEDIA_PER_ARTICLE} media files` }
  }
  return { valid: true }
}

export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  await bucket.put(key, body, { httpMetadata: { contentType } })
}

export async function recordMedia(
  db: D1Database,
  articleId: string,
  r2Key: string,
  altText: string
): Promise<{ id: string; r2Key: string; altText: string }> {
  const id = crypto.randomUUID()
  await db
    .prepare('INSERT INTO media (id, article_id, r2_key, alt_text) VALUES (?, ?, ?, ?)')
    .bind(id, articleId, r2Key, altText)
    .run()
  return { id, r2Key, altText }
}

// Deletes every R2 object recorded for `articleId`, given the article's
// `media` rows. Callers MUST fetch these rows and pass them in BEFORE
// deleting the article: `media.article_id REFERENCES articles(id) ON DELETE
// CASCADE` means the `media` rows disappear automatically the moment
// `deleteArticleRow` runs, so there's no way to look them up afterward. See
// app/api/articles/[id]/route.ts's DELETE handler for the call site.
//
// This is distinct from cleanupOrphanedMedia (lib/media-cleanup.ts), which
// sweeps the whole bucket for objects with no matching `media` row at all --
// this function instead deletes a specific, known set of objects (an
// article's own media) as part of that article's own deletion, so it has no
// need for that function's bucket-wide pagination or TOCTOU grace period.
export async function deleteMediaObjects(
  bucket: R2Bucket,
  db: D1Database,
  articleId: string
): Promise<void> {
  const rows = (
    await db.prepare('SELECT r2_key FROM media WHERE article_id = ?').bind(articleId).all()
  ).results as { r2_key: string }[]
  for (const row of rows) {
    await bucket.delete(row.r2_key)
  }
}

// Inverse of getPublicMediaUrl: given the full public URL stored in an
// article's `coverImage` column, recovers the `r2_key` that produced it, so
// the OLD cover's specific `media` row can be found and cleaned up when a
// writer replaces the cover with a new upload (see
// app/api/articles/[id]/route.ts's PATCH handler and
// deleteMediaObjectByKey below). Returns null rather than throwing when the
// URL doesn't match the currently configured base -- e.g. NEXT_PUBLIC_MEDIA_BASE_URL
// isn't set, or the stored URL predates a base-URL change -- so callers can
// simply skip cleanup instead of risking deleting the wrong object.
export function r2KeyFromPublicUrl(url: string): string | null {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  if (!base) return null
  const prefix = `${base.replace(/\/+$/, '')}/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

// Deletes a single article's media row (and its backing R2 object) by
// article + r2Key. Used when a cover image is replaced, to remove the OLD
// cover instead of leaving it as an orphaned row that permanently consumes
// one of the article's MAX_MEDIA_PER_ARTICLE slots (see
// app/api/articles/[id]/route.ts's PATCH handler). No-op if no matching row
// exists -- distinct from deleteMediaObjects, which deletes ALL of an
// article's media rows/objects (used on article deletion), not one specific
// row by key.
export async function deleteMediaObjectByKey(
  bucket: R2Bucket,
  db: D1Database,
  articleId: string,
  r2Key: string
): Promise<void> {
  const row = await db
    .prepare('SELECT id FROM media WHERE article_id = ? AND r2_key = ?')
    .bind(articleId, r2Key)
    .first<{ id: string }>()
  if (!row) return
  await bucket.delete(r2Key)
  await db.prepare('DELETE FROM media WHERE id = ?').bind(row.id).run()
}

// The R2 bucket backing MEDIA_BUCKET has no public HTTP access of its own --
// R2 objects aren't reachable by URL unless the bucket is explicitly
// connected to a public domain (Cloudflare's free `<bucket>.r2.dev`
// subdomain, or a custom domain like media.mavora.com), which is a
// Cloudflare-dashboard, deploy-time decision outside this codebase's
// control (see .dev.vars.example's NEXT_PUBLIC_MEDIA_BASE_URL entry).
//
// Proxying through a route in either Next.js app was investigated and ruled
// out: this app (cms/) sits entirely behind middleware.ts's
// `isProtectedRoute` matcher (which includes `/api/media(.*)`), so any route
// added here would require a signed-in CMS session -- unusable for public
// readers. The public site (repo root app/) is a fully static export
// (`output: 'export'` in next.config.js, confirmed in DEPLOY.md) with no
// server runtime and no R2 binding at all, so it can't proxy either. A
// directly-public R2 URL is therefore the only viable option; this function
// assumes NEXT_PUBLIC_MEDIA_BASE_URL has been set to it.
export function getPublicMediaUrl(r2Key: string): string {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  if (!base) {
    throw new Error(
      'NEXT_PUBLIC_MEDIA_BASE_URL is not configured. Set it to the public R2 bucket URL ' +
        '(e.g. an r2.dev subdomain or a custom media domain) before uploading media -- see .dev.vars.example.'
    )
  }
  return `${base.replace(/\/+$/, '')}/${r2Key}`
}
