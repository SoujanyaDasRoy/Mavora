// Guards against wrangler.toml and wrangler.test.toml drifting apart.
//
// Task 1 needed two Wrangler config files: wrangler.toml (real deploy
// config, has `main` set) and wrangler.test.toml (bindings-only, used by
// @cloudflare/vitest-pool-workers because a `main`-having config breaks its
// pre-build step -- see wrangler.test.toml's header comment). Both declare
// the same D1/R2 bindings by hand. If a later task adds a binding to one
// file and forgets the other, tests either fail outright or -- worse --
// silently don't exercise the new binding at all, with no automated signal.
//
// This test parses both files and asserts their binding sets match. No
// TOML parser is available as a dependency (checked: not a direct or
// transitive dependency of wrangler or @cloudflare/vitest-pool-workers), so
// this uses a minimal regex-based extraction of `binding = "..."` lines
// rather than pulling in a new full TOML parser for one check. This is a
// plain Node test (needs real filesystem access), so it runs under the
// `config` Vitest project in vitest.config.mts, not the `workers` project
// -- the Workers runtime the `workers` project runs in has no host
// filesystem access (see vitest-setup.ts's comment).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Extracts `binding = "..."` values from every `[[sectionName]]` array-of-
 * tables block in a TOML file's raw text.
 *
 * Deliberately not a general TOML parser: it only looks for the specific
 * shape wrangler.toml/wrangler.test.toml use (`[[d1_databases]]` /
 * `[[r2_buckets]]` blocks each containing a `binding = "..."` line).
 */
function extractBindings(tomlContent: string, sectionName: string): string[] {
  const sectionRegex = new RegExp(
    `\\[\\[${sectionName}\\]\\]([\\s\\S]*?)(?=\\n\\[\\[|\\n\\[[^\\[]|$)`,
    'g'
  )
  const bindings: string[] = []
  let match: RegExpExecArray | null
  while ((match = sectionRegex.exec(tomlContent)) !== null) {
    const bindingMatch = match[1].match(/^\s*binding\s*=\s*"([^"]+)"/m)
    if (bindingMatch) {
      bindings.push(bindingMatch[1])
    }
  }
  return bindings
}

/** All `type:binding` pairs declared across the bound sections we track. */
function bindingSet(tomlContent: string): string[] {
  return [
    ...extractBindings(tomlContent, 'd1_databases').map((b) => `d1_databases:${b}`),
    ...extractBindings(tomlContent, 'r2_buckets').map((b) => `r2_buckets:${b}`),
  ].sort()
}

describe('wrangler.toml / wrangler.test.toml binding parity', () => {
  const wranglerToml = fs.readFileSync(path.join(dirname, 'wrangler.toml'), 'utf-8')
  const wranglerTestToml = fs.readFileSync(path.join(dirname, 'wrangler.test.toml'), 'utf-8')

  it('sanity check: each file declares at least one binding', () => {
    // Guards against the regex silently matching nothing (e.g. after a
    // TOML formatting change) and the parity check below passing vacuously.
    expect(bindingSet(wranglerToml).length).toBeGreaterThan(0)
    expect(bindingSet(wranglerTestToml).length).toBeGreaterThan(0)
  })

  it('declares the same D1/R2 bindings in both files', () => {
    expect(bindingSet(wranglerTestToml)).toEqual(bindingSet(wranglerToml))
  })
})
