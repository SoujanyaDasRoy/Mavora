import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'

// `clerkMiddleware()` resolves a publishable/secret key at call time and
// throws (`throwMissingPublishableKeyError`) if neither is set -- even for
// requests that never end up calling `auth.protect()`. Clerk's own "keyless"
// dev-mode fallback (auto-provisioning temporary keys) is explicitly disabled
// in automated/CI environments (see
// node_modules/@clerk/nextjs/dist/esm/utils/feature-flags.js:
// `canUseKeyless = isDevelopmentEnvironment() && !isAutomatedEnvironment() && ...`)
// and requires filesystem access unavailable in the Workers test sandbox
// regardless. So there is no way to exercise the real `clerkMiddleware()`
// wrapper -- with a real network round-trip to Clerk, or via SELF.fetch
// against the built worker -- without a live Clerk application's keys, which
// this task cannot obtain (see task-2-brief.md / task-2-report.md).
//
// What *is* real product code we own and can regress: `createRouteMatcher`'s
// route list in middleware.ts -- which paths get `auth.protect()` called on
// them. We mock only `clerkMiddleware` (unwrapping it to hand back the raw
// handler function unchanged) and leave the real `createRouteMatcher` from
// '@clerk/nextjs/server' in place, so the actual path-matching regexes run.
vi.mock('@clerk/nextjs/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clerk/nextjs/server')>()
  return {
    ...actual,
    clerkMiddleware: (handler: unknown) => handler,
  }
})

type MiddlewareHandler = (
  auth: { protect: () => Promise<void> },
  req: NextRequest,
  event: unknown
) => Promise<unknown>

// Real `NextRequest`s (which extend `Request`) always carry a `method` and
// `headers`. These tests only exercise route matching -- the CSRF/Origin
// check (`isTrustedOrigin`) has its own dedicated unit tests in
// `lib/csrf.test.ts` -- so every mock request here is a same-origin GET,
// which `isTrustedOrigin` always trusts regardless of Origin header.
function makeRequest(pathname: string): NextRequest {
  return {
    nextUrl: new URL(`https://cms.example.com${pathname}`),
    method: 'GET',
    headers: new Headers(),
  } as unknown as NextRequest
}

async function loadMiddleware(): Promise<MiddlewareHandler> {
  const mod = await import('./middleware')
  return mod.default as unknown as MiddlewareHandler
}

// Each test builds its own `protect`/`auth` pair as *local* bindings rather
// than reading a describe-scoped `let` reassigned in `beforeEach`. That
// matters because `it.each` test bodies are async: under load (e.g. the
// full `npm test` suite running 13 other files' worth of CPU/D1 contention
// concurrently), the very first `await loadMiddleware()` in this file is a
// genuinely cold `import('./middleware')` that can take longer than
// Vitest's 5000ms default `testTimeout`. When that happens, Vitest reports
// the test as timed out and moves on -- but it cannot cancel the still-
// pending promise, so the timed-out test's async function keeps running in
// the background. If `auth`/`protect` were shared `let` bindings reassigned
// by the next test's `beforeEach`, that late-resolving continuation would
// read whatever `auth` happens to be *at the time it finally resumes* --
// which by then belongs to a later test -- and call that later test's
// `protect` mock an extra time (see the `it.each` case order: this exact
// failure always landed on the first two parametrized cases, since the
// cold import always happens on the first one). Building `protect`/`auth`
// as values local to each test closure makes them immune to this: a late
// continuation from a previous test can only ever touch its own,
// already-abandoned mock.
function makeAuth() {
  const protect = vi.fn().mockResolvedValue(undefined)
  const auth = { protect: protect as unknown as () => Promise<void> }
  return { protect, auth }
}

describe('route protection middleware', () => {
  // Warms the `import('./middleware')` module cache before any test's
  // timed body runs, so the one-time cold-import cost (pulling in the
  // whole `@clerk/nextjs/server` dependency graph) is paid against
  // `beforeAll`'s 10000ms `hookTimeout` instead of a test's 5000ms
  // `testTimeout`. Every subsequent `loadMiddleware()` call below just
  // returns the already-cached module. This is what actually removes the
  // timeout risk under full-suite contention -- it isn't a blanket timeout
  // increase, it moves a real one-time setup cost into the hook budget
  // that Vitest already provisions more generously for exactly this
  // purpose.
  beforeAll(async () => {
    await loadMiddleware()
  })

  it.each([
    '/dashboard',
    '/dashboard/',
    '/dashboard/settings',
    '/articles',
    '/articles/123',
    '/api/articles',
    '/api/articles/123',
    '/api/media',
    '/api/writers',
    '/api/stats',
    '/api/cron',
    '/api/cron/cleanup-media',
  ])('calls auth.protect() for protected route %s', async (pathname) => {
    const { protect, auth } = makeAuth()
    const middleware = await loadMiddleware()
    await middleware(auth, makeRequest(pathname), {})
    expect(protect).toHaveBeenCalledTimes(1)
  })

  it.each(['/login', '/', '/favicon.ico'])(
    'does not call auth.protect() for public route %s',
    async (pathname) => {
      const { protect, auth } = makeAuth()
      const middleware = await loadMiddleware()
      await middleware(auth, makeRequest(pathname), {})
      expect(protect).not.toHaveBeenCalled()
    }
  )
})

// Integration coverage for the wiring itself (middleware.ts calling
// `isTrustedOrigin` and turning a `false` result into a 403 response) --
// `isTrustedOrigin`'s own branch logic is unit-tested in `lib/csrf.test.ts`.
describe('CSRF origin check in middleware', () => {
  const originalCmsOrigin = process.env.CMS_ORIGIN

  afterEach(() => {
    if (originalCmsOrigin === undefined) {
      delete process.env.CMS_ORIGIN
    } else {
      process.env.CMS_ORIGIN = originalCmsOrigin
    }
  })

  function makeApiRequest(method: string, origin?: string): NextRequest {
    const headers = new Headers()
    if (origin) headers.set('Origin', origin)
    return {
      nextUrl: new URL('https://cms.example.com/api/articles'),
      method,
      headers,
    } as unknown as NextRequest
  }

  it('returns 403 for a mutating API request from an untrusted origin', async () => {
    process.env.CMS_ORIGIN = 'https://cms.example.com'
    const { auth } = makeAuth()
    const middleware = await loadMiddleware()
    const response = await middleware(auth, makeApiRequest('POST', 'https://evil.example.com'), {})
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).status).toBe(403)
  })

  it('returns 403 for a mutating API request with no Origin header', async () => {
    process.env.CMS_ORIGIN = 'https://cms.example.com'
    const { auth } = makeAuth()
    const middleware = await loadMiddleware()
    const response = await middleware(auth, makeApiRequest('POST'), {})
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).status).toBe(403)
  })

  it('does not return a 403 for a mutating API request whose Origin matches CMS_ORIGIN', async () => {
    process.env.CMS_ORIGIN = 'https://cms.example.com'
    const { auth } = makeAuth()
    const middleware = await loadMiddleware()
    const response = await middleware(auth, makeApiRequest('POST', 'https://cms.example.com'), {})
    expect(response).toBeUndefined()
  })
})
