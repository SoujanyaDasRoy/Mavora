'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_ID
  if (!formId) {
    throw new Error(
      'NEXT_PUBLIC_FORMSPREE_ID is not set. Set it in your environment (see .env.example) before running `npm run build` — otherwise the contact form would ship with a broken submission URL baked into the static HTML.'
    )
  }
  return (
    <form action={`https://formspree.io/f/${formId}`} method="POST" className="flex flex-col gap-5 max-w-md">
      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-2">
          Email
        </label>
        <Input id="email" type="email" name="email" required className="h-10" />
      </div>
      <div>
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-2">
          Message
        </label>
        <Textarea id="message" name="message" required rows={5} />
      </div>

      {/* honeypot field to reduce spam — real users leave it empty */}
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <Button type="submit" className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white h-9 px-6 font-semibold">
        Send message
      </Button>
    </form>
  )
}
