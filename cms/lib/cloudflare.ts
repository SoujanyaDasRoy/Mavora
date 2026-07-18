import { getCloudflareContext } from '@opennextjs/cloudflare'

export function getDb(): D1Database {
  return getCloudflareContext().env.DB
}

export function getMediaBucket(): R2Bucket {
  return getCloudflareContext().env.MEDIA_BUCKET
}
