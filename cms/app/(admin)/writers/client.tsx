'use client'

import { useState, type FormEvent } from 'react'
import { Group, Send, CheckmarkFilled, Warning } from '@carbon/icons-react'
import { MagicCard } from '@/components/ui/magic-card'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { WriterWithCounts } from '@/lib/writers'

interface WritersClientProps {
  writers: WriterWithCounts[]
  lastActivity: Record<string, string>
}

type InviteState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; email: string }
  | { status: 'error'; message: string }

function formatDate(value: string): string {
  if (!value) return '—'
  // D1 returns ISO-ish strings; Date() handles both. Render as e.g. "Jul 26".
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelative(value: string | undefined): string {
  if (!value) return 'No activity'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD}d ago`
  return formatDate(value)
}

export function WritersClient({ writers, lastActivity }: WritersClientProps) {
  const [invite, setInvite] = useState<InviteState>({ status: 'idle' })
  const [email, setEmail] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (invite.status === 'submitting') return
    const trimmed = email.trim()
    if (!trimmed) return

    setInvite({ status: 'submitting' })
    try {
      const res = await fetch('/api/writers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) {
        const body = await res.text()
        setInvite({ status: 'error', message: body || `Invite failed (${res.status})` })
        return
      }
      setInvite({ status: 'success', email: trimmed })
      setEmail('')
    } catch (err) {
      setInvite({
        status: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-fg-subtle)]">Team</p>
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Writers
          </h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Invite new contributors and see who&apos;s publishing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
          <Group className="size-4" />
          <span>{writers.length} {writers.length === 1 ? 'writer' : 'writers'}</span>
        </div>
      </div>

      {/* Invite form */}
      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5"
        gradientSize={220}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.18}
      >
        <div className="flex items-center gap-2 mb-3">
          <Send className="size-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">Invite a writer</h2>
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mb-4">
          Clerk sends a sign-up link. New accounts default to the <code className="text-[var(--color-fg)]">writer</code> role — promote them to admin from the database (or via SQL) once they accept.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (invite.status !== 'idle') setInvite({ status: 'idle' })
            }}
            placeholder="writer@example.com"
            required
            className="flex-1"
            disabled={invite.status === 'submitting'}
          />
          <ShimmerButton
            type="submit"
            background="var(--color-accent)"
            shimmerColor="rgba(255,255,255,0.35)"
            className="text-white"
            disabled={invite.status === 'submitting' || !email.trim()}
          >
            {invite.status === 'submitting' ? 'Sending…' : 'Send invite'}
          </ShimmerButton>
        </form>
        {invite.status === 'success' && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--color-positive)]">
            <CheckmarkFilled className="size-4" />
            Invite sent to <span className="font-medium">{invite.email}</span>. They&apos;ll get an email from Clerk.
          </p>
        )}
        {invite.status === 'error' && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--color-negative)]">
            <Warning className="size-4" />
            {invite.message}
          </p>
        )}
      </MagicCard>

      {/* Writers table */}
      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-0 overflow-hidden"
        gradientSize={200}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.08}
      >
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold">All writers</h2>
        </div>
        {writers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[var(--color-fg-muted)]">
            No writers yet. Send the first invite above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-fg-subtle)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Articles</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Published</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Joined</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {writers.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{w.displayName}</span>
                        <span className="text-xs text-[var(--color-fg-subtle)] font-mono truncate max-w-xs">
                          {w.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={w.role === 'admin' ? 'default' : 'secondary'}
                        className="uppercase tracking-wider"
                      >
                        {w.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-[var(--color-fg-muted)]">
                      {w.articleCount}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[var(--color-fg-muted)]">
                      {w.publishedCount}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[var(--color-fg-muted)]">
                      {formatDate(w.createdAt)}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-[var(--color-fg-muted)]">
                      {formatRelative(lastActivity[w.id])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MagicCard>
    </div>
  )
}