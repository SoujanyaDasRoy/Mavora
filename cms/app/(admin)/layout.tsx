import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { requireRole } from '@/lib/role'

/**
 * Server layout for every authenticated page in the admin app. Enforces
 * an authenticated session + a writer/admin role via `requireRole`, then
 * hands the resolved writer to the client-side `<AppShell>` so the
 * sidebar can hide admin-only items.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) {
    // `auth.protect()` already redirects unauthenticated users; a `Response`
    // from `requireRole` here means "logged in but no writer row" (rare —
    // auto-created on first visit by the API routes) or a stale role. Send
    // back to /login so the user can re-establish their session.
    redirect('/login')
  }

  return <AppShell role={guard.writer.role}>{children}</AppShell>
}