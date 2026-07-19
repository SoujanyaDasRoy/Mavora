import Link from 'next/link'
import { PILLARS, PILLAR_LABELS } from '@/lib/pillars'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--color-border)] mt-16 bg-[var(--color-bg-secondary)]">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 md:gap-10">

          {/* Brand column */}
          <div className="md:col-span-1">
            {/* Logo — blank per user request; insert your logo here */}
            <div className="mb-3 h-8 w-24 border border-dashed border-[var(--color-border)] rounded flex items-center justify-center text-[10px] text-[var(--color-fg-subtle)]">
              Logo
            </div>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              Knowledge for the ambitious. AI, technology, productivity, and business — curated weekly.
            </p>
          </div>

          {/* Topics */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-fg-muted)] mb-3">Topics</p>
            <nav className="flex flex-col gap-2">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar}
                  href={`/${pillar}`}
                  className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {PILLAR_LABELS[pillar]}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-fg-muted)] mb-3">Company</p>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors">About</Link>
              <Link href="/contact" className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors">Contact</Link>
              <Link href="/editorial-standards" className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors">Editorial Standards</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-fg-muted)] mb-3">Legal</p>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors">Terms of Use</Link>
              <Link href="/affiliate-disclosure" className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors">Affiliate Disclosure</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--color-border)] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-fg-subtle)]">
          <p>© {year} Mavora. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/feed.xml" className="hover:text-[var(--color-accent)] transition-colors">RSS Feed</Link>
            <Link href="/sitemap.xml" className="hover:text-[var(--color-accent)] transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
