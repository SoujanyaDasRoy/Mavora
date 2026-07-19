import Link from 'next/link'
import { NewsletterSignup } from './NewsletterSignup'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-16">
      <div className="mx-auto max-w-[1280px] px-6 md:px-8 py-12 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="font-extrabold tracking-wide text-[var(--color-accent)] mb-3">MAVORA</p>
          <nav className="flex flex-col gap-2 text-sm text-[var(--color-fg-muted)]">
            <Link href="/about" className="hover:text-[var(--color-accent)]">About</Link>
            <Link href="/contact" className="hover:text-[var(--color-accent)]">Contact</Link>
            <Link href="/editorial-standards" className="hover:text-[var(--color-accent)]">Editorial Standards</Link>
            <Link href="/privacy" className="hover:text-[var(--color-accent)]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--color-accent)]">Terms of Use</Link>
            <Link href="/affiliate-disclosure" className="hover:text-[var(--color-accent)]">Affiliate Disclosure</Link>
          </nav>
        </div>

        <div className="max-w-sm">
          <NewsletterSignup />
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-6 md:px-8 py-4 text-xs text-[var(--color-fg-muted)]">
        © {new Date().getFullYear()} Mavora. All rights reserved.
      </div>
    </footer>
  )
}
