import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

// When `href` is set we render a Next.js `<Link>` instead of a native
// `<button>`. Putting an `<a>` inside a `<button>` is invalid HTML
// (browsers strip the inner anchor), and clicking the button does NOT
// navigate. This polymorphic switch lets callers write
// `<ShimmerButton href="/articles/new">+ New Article</ShimmerButton>`
// without wrapping it in a Link themselves.
export interface ShimmerButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "href"> {
  href?: string
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: React.ReactNode
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ShimmerButtonProps
>(
  (
    {
      href,
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const styles: CSSProperties = {
      "--spread": "90deg",
      "--shimmer-color": shimmerColor,
      "--radius": borderRadius,
      "--speed": shimmerDuration,
      "--cut": shimmerSize,
      "--bg": background,
    } as CSSProperties
    const cls = cn(
      "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-white/10 px-6 py-3 whitespace-nowrap text-white [background:var(--bg)]",
      "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
      className
    )

    const spark = (
      <>
        <div className={cn("-z-30 blur-[2px]", "@container-[size] absolute inset-0 overflow-visible")}>
          <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
          </div>
        </div>
        {children}
        <div
          className={cn(
            "absolute inset-0 size-full rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]",
            "transform-gpu transition-all duration-300 ease-in-out",
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
          )}
        />
        <div className={cn("absolute inset-(--cut) -z-20 [border-radius:var(--radius)] [background:var(--bg)]")} />
      </>
    )

    if (href !== undefined) {
      return (
        <Link
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          style={styles}
          className={cls}
          {...(props as Omit<ComponentPropsWithoutRef<"a">, "href">)}
        >
          {spark}
        </Link>
      )
    }

    return (
      <button
        style={styles}
        className={cls}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      >
        {spark}
      </button>
    )
  }
)

ShimmerButton.displayName = "ShimmerButton"
