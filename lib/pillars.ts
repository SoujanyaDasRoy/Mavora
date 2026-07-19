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
