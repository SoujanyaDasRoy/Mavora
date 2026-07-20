import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  /** Narrow reading column (static pages, article body) instead of the full 1280px grid width. */
  narrow?: boolean
}

// Single source of truth for the page gutter (px-5 / md:px-8) so every page's
// content lines up with the header and footer instead of drifting by a few
// pixels the way the old ad hoc `px-6` on static/category/article pages did.
export function Container({ children, className, narrow = false }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-5 md:px-8', narrow ? 'max-w-[760px]' : 'max-w-[1280px]', className)}>
      {children}
    </div>
  )
}
