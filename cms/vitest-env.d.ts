// Makes the ambient `cloudflare:test` module (exposing `env`, `SELF`, etc. in
// Vitest tests run under @cloudflare/vitest-pool-workers) resolvable by
// TypeScript. Without this, `import { env } from 'cloudflare:test'` in
// lib/cloudflare.test.ts fails type-checking during `next build`, since that
// ambient declaration lives under the package's `./types` export subpath,
// which isn't picked up automatically.
/// <reference types="@cloudflare/vitest-pool-workers/types" />
