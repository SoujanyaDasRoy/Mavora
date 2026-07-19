import Link from 'next/link'
import { PILLARS, getPostsByPillar } from '@/lib/content'

const PILLAR_LABELS: Record<(typeof PILLARS)[number], string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

export function CategoryList() {
  const counts = PILLARS.map((pillar) => ({
    pillar,
    label: PILLAR_LABELS[pillar],
    count: getPostsByPillar(pillar).length,
  }))

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-3">Categories</h3>
      <ul className="flex flex-col gap-2">
        {counts.map(({ pillar, label, count }) => (
          <li key={pillar} className="flex justify-between items-center">
            <Link href={`/${pillar}`} className="hover:text-[var(--color-accent)] transition-colors">
              {label}
            </Link>
            <span className="text-sm text-[var(--color-fg-muted)]">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
