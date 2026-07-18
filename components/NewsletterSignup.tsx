'use client'

export function NewsletterSignup() {
  const username = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME
  return (
    <form action={`https://buttondown.com/api/emails/embed-subscribe/${username}`} method="POST" target="popupwindow">
      <label htmlFor="bd-email">Subscribe to the newsletter</label>
      <input id="bd-email" type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  )
}
