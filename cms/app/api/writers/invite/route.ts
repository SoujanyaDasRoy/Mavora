import { z } from 'zod'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'

const inviteSchema = z.object({ email: z.string().email() })

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer || writer.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  const body = await request.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  // clerkClient() reads CLERK_SECRET_KEY at call-time; if it's not set it
  // throws synchronously. Wrap so the writers UI shows a clean error rather
  // than a 500. Common failures: missing CLERK_SECRET_KEY, Clerk instance
  // missing the "Invitations" feature toggle, redirect URL misconfigured
  // for the production instance.
  try {
    const client = await clerkClient()
    await client.invitations.createInvitation({
      emailAddress: parsed.data.email,
      // Clerk's invitation.emailAddress is a verified-only field. The
      // public site doesn't yet expose the "sign-up" path via Clerk's
      // hosted Account Portal, so we can't pass a meaningful
      // `redirectUrl` here without a wrong-URL-on-prod bug. The
      // invitation lands in the invitee's inbox with a default Clerk
      // accept link; promote them via the writers table after they
      // accept and sign in.
      ignoreExisting: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clerk invitation failed'
    return new Response(JSON.stringify({ error: message }), { status: 502 })
  }

  return new Response(JSON.stringify({ invited: parsed.data.email }), { status: 200 })
}
