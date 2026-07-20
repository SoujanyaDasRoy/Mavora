// Small red accent segment in the rule is the ONLY intentional red most
// pages carry — every section/page eyebrow across the site reuses this one
// treatment instead of full red-colored label text, so red stays reserved
// for the primary action (Subscribe) and article-body links.
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
        {children}
      </p>
      <div
        className="mt-1.5 h-[1.5px] w-full"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-accent) 48px, var(--color-border) 48px)',
        }}
      />
    </div>
  )
}
