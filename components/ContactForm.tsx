'use client'

export function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_ID
  if (!formId) {
    throw new Error(
      'NEXT_PUBLIC_FORMSPREE_ID is not set. Set it in your environment (see .env.example) before running `npm run build` — otherwise the contact form would ship with a broken submission URL baked into the static HTML.'
    )
  }
  return (
    <form action={`https://formspree.io/f/${formId}`} method="POST" className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-1">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className="w-full rounded border border-[var(--color-border)] bg-transparent px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-semibold mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded border border-[var(--color-border)] bg-transparent px-3 py-2"
        />
      </div>

      {/* honeypot field to reduce spam — real users leave it empty */}
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button
        type="submit"
        className="self-start rounded bg-[var(--color-accent)] text-white px-5 py-2 font-semibold hover:opacity-90 transition-opacity"
      >
        Send
      </button>
    </form>
  )
}
