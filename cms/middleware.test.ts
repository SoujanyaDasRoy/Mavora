import { describe, it, expect, vi, beforeEach } from 'vitest'
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

function makeRequest(pathname: string): NextRequest {
  return { nextUrl: new URL(`https://cms.example.com${pathname}`) } as unknown as NextRequest
}

async function loadMiddleware(): Promise<MiddlewareHandler> {
  const mod = await import('./middleware')
  return mod.default as unknown as MiddlewareHandler
}

describe('route protection middleware', () => {
  let protect: ReturnType<typeof vi.fn>
  let auth: { protect: () => Promise<void> }

  beforeEach(() => {
    protect = vi.fn().mockResolvedValue(undefined)
    auth = { protect: protect as unknown as () => Promise<void> }
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
  ])('calls auth.protect() for protected route %s', async (pathname) => {
    const middleware = await loadMiddleware()
    await middleware(auth, makeRequest(pathname), {})
    expect(protect).toHaveBeenCalledTimes(1)
  })

  it.each(['/login', '/', '/favicon.ico'])(
    'does not call auth.protect() for public route %s',
    async (pathname) => {
      const middleware = await loadMiddleware()
      await middleware(auth, makeRequest(pathname), {})
      expect(protect).not.toHaveBeenCalled()
    }
  )
})
