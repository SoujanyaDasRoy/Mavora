'use client'

import { useState } from 'react'

export function InviteWriterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const response = await fetch('/api/writers/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus(response.ok ? 'sent' : 'error')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="invite-email">Invite a writer</label>
      <input
        id="invite-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={status === 'sending'}>
        Send invite
      </button>
      {status === 'sent' && <p>Invitation sent.</p>}
      {status === 'error' && <p>Failed to send invitation.</p>}
    </form>
  )
}
