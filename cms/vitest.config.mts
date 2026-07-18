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
  test: {
    // Vitest v4's `test.projects` (replacement for the old
    // `vitest.workspace.ts` file) lets a single `vitest run` invocation
    // fan out to multiple differently-configured sub-projects. We need two
    // here: `cloudflareTest()` below forces its project onto the
    // `cloudflare-pool`, which runs test code inside the workerd sandbox --
    // no access to the host filesystem (see vitest-setup.ts's comment).
    // wrangler-bindings.test.ts is a plain Node file-parsing test (reads
    // wrangler.toml/wrangler.test.toml off disk) and must NOT run inside
    // that sandbox, so it gets its own plain-Node project instead of
    // living in the Workers project below.
    projects: [
      {
        // Reads migrations/*.sql on the Node side (the Workers runtime has
        // no filesystem access) and hands them to vitest-setup.ts via the
        // TEST_MIGRATIONS binding, which applies them to the per-run D1
        // instance before tests execute. Uses wrangler.test.toml (bindings
        // only, no `main`) rather than wrangler.toml -- see
        // wrangler.test.toml's header comment for why.
        plugins: [
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
          name: 'workers',
          include: ['lib/**/*.test.ts'],
          setupFiles: ['./vitest-setup.ts'],
        },
      },
      {
        // Plain Node project, no Workers pool -- for tests that only need
        // regular filesystem/Node APIs, like the wrangler.toml /
        // wrangler.test.toml binding-parity guard.
        test: {
          name: 'config',
          include: ['*.test.ts'],
        },
      },
    ],
  },
})
