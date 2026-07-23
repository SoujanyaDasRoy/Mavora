// Kept in its own module (no `node:fs`/`gray-matter`/`zod` imports) so that Client
// Components can import PILLARS without pulling server-only code into the browser
// bundle. `lib/content.ts` re-exports this for existing server-side consumers.
export const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const
export type Pillar = (typeof PILLARS)[number]

// Single source of truth for human-readable pillar names. Previously copy-pasted
// across app/[pillar]/page.tsx, ArticleCard.tsx, CategoryList.tsx, and Header.tsx.
export const PILLAR_LABELS: Record<Pillar, string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

export const PILLAR_COLORS: Record<Pillar, { text: string; bg: string; border: string }> = {
  ai: {
    text: 'text-[var(--color-ai-text)]',
    bg: 'bg-[var(--color-ai-bg)]',
    border: 'border-[var(--color-ai-border)]',
  },
  technology: {
    text: 'text-[var(--color-tech-text)]',
    bg: 'bg-[var(--color-tech-bg)]',
    border: 'border-[var(--color-tech-border)]',
  },
  productivity: {
    text: 'text-[var(--color-prod-text)]',
    bg: 'bg-[var(--color-prod-bg)]',
    border: 'border-[var(--color-prod-border)]',
  },
  business: {
    text: 'text-[var(--color-bus-text)]',
    bg: 'bg-[var(--color-bus-bg)]',
    border: 'border-[var(--color-bus-border)]',
  },
}
