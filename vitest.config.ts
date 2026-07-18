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
  },
})
