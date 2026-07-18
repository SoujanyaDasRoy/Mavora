// Augments the `CloudflareEnv` global interface declared by
// `@opennextjs/cloudflare` with this app's own bindings from wrangler.toml.
// (The adapter only declares its own built-in bindings by default; consumer
// bindings like D1/R2 must be added here for `getCloudflareContext().env` to
// type-check.)
declare global {
  interface CloudflareEnv {
    DB: D1Database
    MEDIA_BUCKET: R2Bucket
  }
}

export {}
