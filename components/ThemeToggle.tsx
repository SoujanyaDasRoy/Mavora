'use client'

import { useLayoutEffect, useState } from 'react'

export function ThemeToggle() {
  // Initial state matches what SSR always renders (`false`, since there's no DOM on
  // the server), so the server-rendered markup and the client's first render agree —
  // no hydration mismatch. useLayoutEffect then runs synchronously after the DOM is
  // mutated but before the browser paints, so it can correct `isDark` to match the
  // real DOM state (already set by the pre-paint script in layout.tsx) without ever
  // showing a visible flash of the wrong icon.
  const [isDark, setIsDark] = useState(false)

  useLayoutEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="rounded-full p-2 text-[var(--color-fg)] hover:bg-[var(--color-border)] transition-colors"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
