import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    // content.test.ts writes/removes a real fixture file in content/posts/technology
    // around its pillar-mismatch test. Running test files in parallel lets that
    // fixture exist while other files scan the content directory (e.g. sitemap.test.ts),
    // causing intermittent failures. Force sequential file execution to avoid the race.
    fileParallelism: false,
    // cms/ is a separate Next.js app with its own vitest config (Cloudflare
    // Workers pool via @cloudflare/vitest-pool-workers) -- without this
    // exclude, the default include glob picks up cms/**/*.test.ts too and
    // runs them under this plain-node environment, where `cloudflare:test`
    // doesn't exist, producing 14 unrelated false failures on every root
    // `npm test`. Run `cd cms && npm test` separately for that app's suite.
    exclude: ['**/node_modules/**', 'cms/**'],
  },
})
