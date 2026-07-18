// Adapted from the brief: @cloudflare/vitest-pool-workers 0.18.6 (installed)
// targets Vitest v4's plugin-based custom-pool API. The brief's assumed
// `defineWorkersConfig` from '@cloudflare/vitest-pool-workers/config' no
// longer exists in this version -- the package ships a codemod
// (dist/codemods/vitest-v3-to-v4.mjs) confirming the replacement is the
// `cloudflareTest` Vite plugin below, configured via plain Vitest
// `defineConfig` from 'vitest/config'.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    // Reads migrations/*.sql on the Node side (the Workers runtime has no
    // filesystem access) and hands them to vitest-setup.ts via the
    // TEST_MIGRATIONS binding, which applies them to the per-run D1 instance
    // before tests execute. Uses wrangler.test.toml (bindings only, no
    // `main`) rather than wrangler.toml -- see wrangler.test.toml's header
    // comment for why.
    cloudflareTest(async () => ({
      wrangler: { configPath: './wrangler.test.toml' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(path.join(dirname, 'migrations')),
        },
      },
    })),
  ],
  test: {
    setupFiles: ['./vitest-setup.ts'],
  },
})
