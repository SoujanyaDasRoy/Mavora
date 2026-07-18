import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { isTrustedOrigin } from './lib/csrf'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/articles(.*)',
  '/api/articles(.*)',
  '/api/media(.*)',
  '/api/writers(.*)',
  '/api/stats(.*)',
])

const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  if (isApiRoute(req) && !isTrustedOrigin(req, process.env.CMS_ORIGIN ?? '')) {
    return new Response('Forbidden: origin check failed', { status: 403 })
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
