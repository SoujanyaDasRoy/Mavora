'use client'

export function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_ID
  if (!formId) {
    throw new Error(
      'NEXT_PUBLIC_FORMSPREE_ID is not set. Set it in your environment (see .env.example) before running `npm run build` — otherwise the contact form would ship with a broken submission URL baked into the static HTML.'
    )
  }
  return (
    <form action={`https://formspree.io/f/${formId}`} method="POST">
      <label htmlFor="email">Email</label>
      <input id="email" type="email" name="email" required />

      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" required />

      {/* honeypot field to reduce spam — real users leave it empty */}
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button type="submit">Send</button>
    </form>
  )
}
