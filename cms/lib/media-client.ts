// Client-side (browser) helper for uploading media through
// POST /api/media/upload. Kept separate from lib/media.ts's other exports
// (uploadToR2, recordMedia, deleteMediaObjects), which take live Cloudflare
// R2Bucket/D1Database bindings only available server-side inside API
// routes -- this file only ever runs in the writer's browser, from client
// components like BlockEditor and the article pages.
//
// getPublicMediaUrl itself is re-exported from lib/media.ts rather than
// duplicated: that module has no imports of its own (just ambient
// R2Bucket/D1Database *type* references, erased at compile time), so it's
// safe to pull into a client bundle, and this keeps the URL-construction
// logic (and its test coverage in lib/media.test.ts) in one place.
export { getPublicMediaUrl } from './media'

export interface UploadedMedia {
  id: string
  r2Key: string
  altText: string
}

export class MediaUploadError extends Error {}

/**
 * Uploads a single file for the given article via the existing
 * POST /api/media/upload endpoint (app/api/media/upload/route.ts), which
 * expects a multipart form with `file`, `articleId`, and `altText` fields
 * and returns the recorded `{ id, r2Key, altText }` on success.
 */
export async function uploadMediaFile(
  articleId: string,
  file: File,
  altText: string
): Promise<UploadedMedia> {
  const form = new FormData()
  form.append('articleId', articleId)
  form.append('altText', altText)
  form.append('file', file)

  const response = await fetch('/api/media/upload', { method: 'POST', body: form })
  if (!response.ok) {
    let detail = ''
    try {
      const body = (await response.json()) as { error?: string }
      detail = body.error ?? ''
    } catch {
      // Response body wasn't JSON (e.g. a plain-text 401/403/404) -- fall
      // back to the status text below.
    }
    throw new MediaUploadError(detail || `Upload failed with status ${response.status}`)
  }

  return (await response.json()) as UploadedMedia
}
