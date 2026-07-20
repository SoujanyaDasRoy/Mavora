import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  /** Cap the reading column to 760px (static pages, article body) instead of the full 1440px grid width. */
  narrow?: boolean
}

// Single source of truth for the page gutter (px-5 / md:px-8) so every page's
// content lines up with the header and footer instead of drifting by a few
// pixels the way the old ad hoc `px-6` on static/category/article pages did.
//
// The outer box is ALWAYS the same max-w-1440 as the header/footer, so every
// page starts flush against the same left edge — `narrow` only caps the
// reading width of an inner wrapper, it doesn't re-center a smaller box
// independently in the viewport (that used to make narrow pages like About
// jump to a completely different left margin than the header above them).
export function Container({ children, className, narrow = false }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-5 md:px-8 max-w-[1440px]', className)}>
      {narrow ? <div className="max-w-[760px]">{children}</div> : children}
    </div>
  )
}
