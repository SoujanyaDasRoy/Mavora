'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

interface Props {
  /** When true, renders a minimal inline form without the section header card */
  compact?: boolean
}

export function InviteWriterForm({ compact = false }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const res = await fetch('/api/writers/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) { setStatus('sent'); setEmail('') }
    else setStatus('error')
  }

  const form = (
    <>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--c-fg-2)', lineHeight: 1.5 }}>
              Send a Clerk invitation email. They&apos;ll join as a writer and can create drafts.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          id="invite-email"
          type="email"
          className="form-control"
          placeholder="writer@readmavora.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'sending' || status === 'sent'}
          style={{ flex: 1, minWidth: '160px' }}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={status === 'sending' || status === 'sent'}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {status === 'sending' ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Sending…
            </>
          ) : status === 'sent' ? '✓ Sent!' : 'Invite →'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {status === 'sent' && (
          <motion.p key="sent"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--c-green)' }}>
            ✓ Invite sent — they'll get an email from Clerk.
          </motion.p>
        )}
        {status === 'error' && (
          <motion.p key="error"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--c-accent)' }}>
            ✗ Failed — only admins can invite writers.
          </motion.p>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )

  if (compact) return form

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.4 }}
    >
      <div className="form-section">
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Invite a Writer</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--c-fg-2)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Send a Clerk invitation email. They&apos;ll join as a writer and can create drafts.
        </p>
        {form}
      </div>
    </motion.div>
  )
}
