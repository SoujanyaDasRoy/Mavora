import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { requireRole } from '@/lib/role'
import { SettingsClient } from './client'

export default async function SettingsPage() {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) redirect('/login')

  const user = await currentUser()
  const profile = {
    displayName: guard.writer.displayName,
    role: guard.writer.role,
    email: user?.emailAddresses?.[0]?.emailAddress ?? null,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    imageUrl: user?.imageUrl ?? null,
    createdAt: guard.writer.createdAt,
  }

  return <SettingsClient profile={profile} />
}