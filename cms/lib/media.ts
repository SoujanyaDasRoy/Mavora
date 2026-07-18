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
