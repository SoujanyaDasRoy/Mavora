'use client'

import { useState } from 'react'

export function ThemeToggle() {
  // Lazy initializer reads the real DOM state synchronously during the first client
  // render, avoiding a one-frame flash of the wrong icon. The `typeof document` guard
  // keeps this SSR-safe (server render has no DOM and just gets `false`, which is
  // irrelevant since this Client Component's server-rendered markup isn't what the
  // user sees first paint of on the client — the pre-paint script in layout.tsx has
  // already set the `.dark` class before this component's client render runs).
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

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
