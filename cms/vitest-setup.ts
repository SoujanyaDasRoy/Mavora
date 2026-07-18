// Runs inside the Workers runtime before each test file. Applies the D1
// schema migrations (read from disk on the Node side in vitest.config.mts
// and passed in as the `TEST_MIGRATIONS` binding, since the Workers runtime
// has no access to the host filesystem) to the local, isolated D1 instance
// that @cloudflare/vitest-pool-workers provisions per test run.
import { applyD1Migrations, createExecutionContext, env } from 'cloudflare:test'

await applyD1Migrations(env.DB, (env as unknown as { TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1] }).TEST_MIGRATIONS)

// `lib/cloudflare.ts`'s `getDb`/`getMediaBucket` read bindings via
// `@opennextjs/cloudflare`'s `getCloudflareContext()`, which (in its default
// sync mode) looks up a well-known global symbol that's normally populated
// by either the production worker entrypoint or, in `next dev`, by
// `initOpenNextCloudflareForDev()` -- see
// node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js. Route
// handler tests run here call the handler directly (bypassing both of
// those), so without this the first `getCloudflareContext()` call throws
// "called without having called `initOpenNextCloudflareForDev`". Populating
// the same symbol with this sandbox's `env`/`ctx` lets route code call
// `getDb()` exactly as it does in production/dev.
const cloudflareContextSymbol = Symbol.for('__cloudflare-context__')
;(globalThis as unknown as Record<symbol, unknown>)[cloudflareContextSymbol] = {
  env,
  ctx: createExecutionContext(),
  cf: {},
}
