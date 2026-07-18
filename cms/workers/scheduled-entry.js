// Wrangler's `main` (see ../wrangler.toml) points here instead of directly
// at `.open-next/worker.js`.
//
// Why this file exists: a Cloudflare Cron Trigger invokes a `scheduled`
// handler on the Worker's default export
// (https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/),
// not an HTTP request. The OpenNext Cloudflare adapter
// (@opennextjs/cloudflare 1.20.1, confirmed by reading
// node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js) only
// generates `export default { async fetch(request, env, ctx) {...} }` --
// there is no `scheduled` export to hook into. And `.open-next/worker.js`
// itself can't be hand-edited to add one: it's a build artifact copied
// verbatim from that same template file on every
// `opennextjs-cloudflare build` (see
// node_modules/@opennextjs/cloudflare/dist/cli/build/utils/copy-package-cli-files.js's
// `copyPackageCliFiles`), so any manual edit would be silently discarded on
// the next build.
//
// This file wraps the generated worker instead: it re-exports its `fetch`
// untouched (all normal HTTP/Next.js routing, including
// `GET /api/cron/cleanup-media`, keeps working exactly as before) and adds
// our own `scheduled` handler for the weekly R2 orphan cleanup. The
// `scheduled` handler calls `cleanupOrphanedMedia` directly with the `env`
// Cloudflare passes into `scheduled()`, rather than routing through the
// `/api/cron/cleanup-media` HTTP route -- a Cron Trigger event has no HTTP
// request for the generated worker's `fetch` handler to route in the first
// place, so going through Next.js routing would need either a synthetic
// internal `fetch()` call (avoidable extra work/failure surface) or reaching
// into `@opennextjs/cloudflare`'s request-scoped context internals outside
// of an actual request (unsupported/fragile). Calling the shared
// `lib/media-cleanup.ts` function directly avoids both.
//
// Plain JS, not TypeScript: `../.open-next/worker.js` only exists after
// `npm run cf:build` runs (it's gitignored -- see .gitignore's "cloudflare /
// wrangler" section). A `.ts` file here would need to import that path too,
// which would fail `tsc --noEmit` on a clean checkout before the first
// build. Mirrors the adapter's own template file, which is plain JS for the
// same reason (its imports like "./cloudflare/images.js" don't exist until
// build time either -- see its "@ts-expect-error: Will be resolved by
// wrangler build" comments). Wrangler bundles this file with esbuild at
// build/deploy time regardless of the .js/.ts split, so it can still import
// the TypeScript `cleanupOrphanedMedia` below.
import openNextWorker from '../.open-next/worker.js'
import { cleanupOrphanedMedia } from '../lib/media-cleanup'

// Forwards any other named exports (e.g. the Durable Object classes the
// adapter's default caching config may bind) so adding this wrapper never
// silently breaks bindings that reference them, even though this project's
// wrangler.toml doesn't declare any Durable Object bindings today.
export * from '../.open-next/worker.js'

export default {
  fetch: openNextWorker.fetch,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(cleanupOrphanedMedia(env.DB, env.MEDIA_BUCKET))
  },
}
