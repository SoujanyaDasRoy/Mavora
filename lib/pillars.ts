// Kept in its own module (no `node:fs`/`gray-matter`/`zod` imports) so that Client
// Components can import PILLARS without pulling server-only code into the browser
// bundle. `lib/content.ts` re-exports this for existing server-side consumers.
export const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const
export type Pillar = (typeof PILLARS)[number]
