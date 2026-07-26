'use client'

import { useState, useEffect } from 'react'
import { User, PaintBrush, Notification, Warning, CheckmarkFilled } from '@carbon/icons-react'
import { MagicCard } from '@/components/ui/magic-card'
import { ShinyButton } from '@/components/ui/shiny-button'
import { Badge } from '@/components/ui/badge'
import { useTheme, type Theme } from '@/components/theme-provider'

interface Profile {
  displayName: string
  role: 'admin' | 'writer'
  email: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  createdAt: string
}

const THEMES: Array<{
  id: Theme
  label: string
  description: string
  preview: { bg: string; fg: string; accent: string; accentName: string }
}> = [
  {
    id: 'light',
    label: 'Light (Daylight)',
    description: 'Warm cream backdrop for bright daylight reading.',
    preview: { bg: '#F4EFE6', fg: '#1A1816', accent: '#B6791F', accentName: 'Warm Amber' },
  },
  {
    id: 'dark',
    label: 'Studio Booth (Dark)',
    description: 'Warm dark booth mode for long editorial focus sessions.',
    preview: { bg: '#1A1816', fg: '#F2EDE5', accent: '#E8A33D', accentName: 'VU Amber' },
  },
  {
    id: 'dark-oled',
    label: 'Night Booth (OLED)',
    description: 'Deep black with amber glow. Saves OLED pixels.',
    preview: { bg: '#000000', fg: '#F2EDE5', accent: '#F2B652', accentName: 'Bright Amber' },
  },
]

function formatDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface NotificationPrefs {
  auditDigest: boolean
  publishConfirm: boolean
  inviteConfirm: boolean
}

const PREFS_KEY = 'cms-notification-prefs'

function readPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return { auditDigest: true, publishConfirm: true, inviteConfirm: true }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...readPrefs(), ...JSON.parse(raw) }
  } catch {
    // localStorage blocked
  }
  return { auditDigest: true, publishConfirm: true, inviteConfirm: true }
}

function writePrefs(prefs: NotificationPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export function SettingsClient({ profile }: { profile: Profile }) {
  const { theme, setTheme } = useTheme()
  const [savedTheme, setSavedTheme] = useState<Theme | null>(null)
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    auditDigest: true,
    publishConfirm: true,
    inviteConfirm: true,
  })
  const [savedPrefs, setSavedPrefs] = useState(false)

  useEffect(() => {
    setPrefs(readPrefs())
  }, [])

  function onPickTheme(next: Theme) {
    setTheme(next)
    setSavedTheme(next)
  }

  function togglePref(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    writePrefs(next)
    setSavedPrefs(true)
    window.setTimeout(() => setSavedPrefs(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-fg-subtle)]">Account</p>
        <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Profile, theme, and notification preferences.
        </p>
      </div>

      {/* Profile */}
      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5"
        gradientSize={200}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.12}
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="size-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>
        <div className="flex items-start gap-4 flex-wrap">
          {profile.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.imageUrl}
              alt={profile.displayName}
              className="size-14 rounded-full border border-[var(--color-border)]"
            />
          ) : (
            <div className="size-14 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)]">
              <User className="size-7" />
            </div>
          )}
          <div className="flex-1 min-w-[240px] space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-semibold">{profile.displayName}</p>
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="uppercase tracking-wider">
                {profile.role}
              </Badge>
            </div>
            {profile.email && (
              <p className="text-xs text-[var(--color-fg-muted)]">{profile.email}</p>
            )}
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Joined {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-[var(--color-fg-muted)]">
          Update your name or avatar in the Clerk account menu (top-right).
        </p>
      </MagicCard>

      {/* Theme picker */}
      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5"
        gradientSize={220}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.10}
      >
        <div className="flex items-center gap-2 mb-1">
          <PaintBrush className="size-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">Theme</h2>
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mb-4">
          Pick how Mavora should look. The choice persists across reloads.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const active = theme === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPickTheme(t.id)}
                className={`group relative rounded-lg border p-3 text-left transition-all ${
                  active
                    ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div
                  className="aspect-[4/3] w-full rounded-md border border-black/10 overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: t.preview.bg, color: t.preview.fg }}
                >
                  <div className="flex flex-col gap-1.5 w-3/4">
                    <div className="h-2 rounded" style={{ backgroundColor: t.preview.fg, opacity: 0.85 }} />
                    <div className="h-2 rounded w-2/3" style={{ backgroundColor: t.preview.fg, opacity: 0.4 }} />
                    <div className="mt-2 h-6 rounded flex items-center justify-center text-[10px] font-medium" style={{ backgroundColor: t.preview.accent, color: '#fff' }}>
                      Accent
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">{t.preview.accentName}</p>
                  </div>
                  {active && (
                    <CheckmarkFilled className="size-4 text-[var(--color-accent)]" />
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">{t.description}</p>
              </button>
            )
          })}
        </div>
        {savedTheme && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--color-positive)]">
            <CheckmarkFilled className="size-4" />
            Theme set to {THEMES.find((t) => t.id === savedTheme)?.label}.
          </p>
        )}
      </MagicCard>

      {/* Notifications */}
      <MagicCard
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5"
        gradientSize={200}
        gradientFrom="var(--color-accent)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.08}
      >
        <div className="flex items-center gap-2 mb-1">
          <Notification className="size-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mb-4">
          Cosmetic toggles for the UI. Backend digests are wired up to Buttondown separately.
        </p>
        <div className="space-y-3">
          <NotificationToggle
            label="Audit digest"
            description="Daily summary of every create / update / publish in the workspace."
            checked={prefs.auditDigest}
            onChange={() => togglePref('auditDigest')}
          />
          <NotificationToggle
            label="Publish confirmations"
            description="Toast when an article you authored is published."
            checked={prefs.publishConfirm}
            onChange={() => togglePref('publishConfirm')}
          />
          <NotificationToggle
            label="Invite confirmations"
            description="Email when a writer you invited accepts and signs in."
            checked={prefs.inviteConfirm}
            onChange={() => togglePref('inviteConfirm')}
          />
        </div>
        {savedPrefs && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--color-positive)]">
            <CheckmarkFilled className="size-4" />
            Saved.
          </p>
        )}
      </MagicCard>

      {/* Danger zone */}
      <MagicCard
        className="rounded-xl border border-[var(--color-negative)]/30 bg-[var(--color-bg-secondary)] p-5"
        gradientSize={200}
        gradientFrom="var(--color-negative)"
        gradientTo="var(--color-accent-hover)"
        gradientOpacity={0.06}
      >
        <div className="flex items-center gap-2 mb-1">
          <Warning className="size-4 text-[var(--color-negative)]" />
          <h2 className="text-sm font-semibold">Danger zone</h2>
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mb-4">
          Destructive actions. Disabled — wire them up when you decide what &quot;delete workspace&quot; means.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <ShinyButton
            aria-disabled="true"
            className="opacity-50 pointer-events-none"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--color-negative)',
              color: 'var(--color-negative)',
            }}
          >
            Delete all drafts
          </ShinyButton>
          <ShinyButton
            aria-disabled="true"
            className="opacity-50 pointer-events-none"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--color-negative)',
              color: 'var(--color-negative)',
            }}
          >
            Transfer workspace
          </ShinyButton>
        </div>
      </MagicCard>
    </div>
  )
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-md border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative mt-0.5 h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-tertiary)]'
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--color-fg-muted)]">{description}</p>
      </div>
    </label>
  )
}