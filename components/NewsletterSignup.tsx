'use client'

export function NewsletterSignup() {
  const username = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME
  if (!username) {
    throw new Error(
      'NEXT_PUBLIC_BUTTONDOWN_USERNAME is not set. Set it in your environment (see .env.example) before running `npm run build` — otherwise the newsletter form would ship with a broken subscribe URL baked into the static HTML.'
    )
  }
  return (
    <form action={`https://buttondown.com/api/emails/embed-subscribe/${username}`} method="POST" target="popupwindow">
      <label htmlFor="bd-email">Subscribe to the newsletter</label>
      <input id="bd-email" type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  )
}
