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

  const client = await clerkClient()
  await client.invitations.createInvitation({ emailAddress: parsed.data.email })

  return new Response(JSON.stringify({ invited: parsed.data.email }), { status: 200 })
}
