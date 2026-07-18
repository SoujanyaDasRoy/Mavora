'use client'

export function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_ID
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
