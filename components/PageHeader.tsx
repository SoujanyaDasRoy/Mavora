import { SectionLabel } from '@/components/SectionLabel'

interface PageHeaderProps {
  eyebrow: string
  title: string
  dek?: string
}

// Shared title block for every non-homepage page — reuses the homepage's
// neutral SectionLabel (not red text) so red stays reserved for the one
// primary action instead of appearing on every page's title.
export function PageHeader({ eyebrow, title, dek }: PageHeaderProps) {
  return (
    <div className="pt-10 md:pt-14 pb-2">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h1 className="font-display font-bold text-[2rem] md:text-[2.75rem] leading-[1.08] tracking-[-0.02em] mb-3">
        {title}
      </h1>
      {dek && (
        <p className="text-[15px] md:text-[16px] text-[var(--color-fg-muted)] leading-relaxed max-w-[620px] mb-8">
          {dek}
        </p>
      )}
    </div>
  )
}
