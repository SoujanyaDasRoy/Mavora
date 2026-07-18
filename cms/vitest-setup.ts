// Runs inside the Workers runtime before each test file. Applies the D1
// schema migrations (read from disk on the Node side in vitest.config.mts
// and passed in as the `TEST_MIGRATIONS` binding, since the Workers runtime
// has no access to the host filesystem) to the local, isolated D1 instance
// that @cloudflare/vitest-pool-workers provisions per test run.
import { applyD1Migrations, env } from 'cloudflare:test'

await applyD1Migrations(env.DB, (env as unknown as { TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1] }).TEST_MIGRATIONS)
