/** @type {import('next').NextConfig} */
const nextConfig = {
  // cms/ has its own package-lock.json but lives inside the Mavora repo,
  // which has a separate, unrelated package-lock.json at its root (for the
  // public site). Without this, Next.js's Turbopack warns that it inferred
  // the wrong workspace root from the repo-root lockfile.
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig

// Enables `getCloudflareContext()` to work when running the regular
// `next dev` server, by proxying Cloudflare bindings (D1, R2, etc.)
// declared in wrangler.toml into the local dev process.
// See: @opennextjs/cloudflare README / getCloudflareContext docs.
const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare')
initOpenNextCloudflareForDev()
