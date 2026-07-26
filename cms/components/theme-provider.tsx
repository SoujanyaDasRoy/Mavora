'use client'

/**
 * Three-way theme: light / dark / dark-oled.
 *
 * Built on top of `next-themes` so the open-source Magic UI primitives
 * (`magic-card`, etc.) that call `useTheme()` to branch light/dark keep
 * working unchanged. `dark-oled` is the same as `dark` from next-themes'
 * perspective, with an extra `oled` class on <html> that the more specific
 * `.dark.oled` rule in `globals.css` uses to override selected tokens.
 *
 * - Persists user choice to `localStorage.cms-theme`
 * - Falls back to `prefers-color-scheme` on first visit
 * - Adds the `oled` class when applicable, removes it on light/dark
 */

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'dark-oled'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'cms-theme'

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'dark-oled') return raw
  } catch {
    // localStorage blocked — fall through
  }
  return null
}

function applyOledClass(theme: Theme) {
  // `dark` is managed by next-themes on <html>; we only own `oled`.
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('oled', theme === 'dark-oled')
}

function InnerProvider({ children }: { children: ReactNode }) {
  const { theme, resolvedTheme, setTheme: setNextTheme } = useNextTheme()
  const [localTheme, setLocalTheme] = useState<Theme>('light')

  // Reconcile stored/system → local mirror on mount. We deliberately wait
  // until `mounted` (provided by next-themes) so we don't read localStorage
  // during SSR.
  useEffect(() => {
    const stored = readStoredTheme()
    if (stored) {
      setLocalTheme(stored)
      applyOledClass(stored)
      const nextThemeValue = stored === 'dark-oled' ? 'dark' : stored
      if (nextThemeValue !== theme) setNextTheme(nextThemeValue)
      return
    }
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved: Theme = systemDark ? 'dark' : 'light'
    setLocalTheme(resolved)
    if (resolved !== theme && theme !== 'system') setNextTheme(resolved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback(
    (next: Theme) => {
      setLocalTheme(next)
      applyOledClass(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      setNextTheme(next === 'dark-oled' ? 'dark' : next)
    },
    [setNextTheme]
  )

  const cycleTheme = useCallback(() => {
    setLocalTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : prev === 'dark' ? 'dark-oled' : 'light'
      applyOledClass(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      setNextTheme(next === 'dark-oled' ? 'dark' : next)
      return next
    })
  }, [setNextTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme: localTheme,
        resolvedTheme: (resolvedTheme === 'dark' ? 'dark' : 'light'),
        setTheme,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function ThemeProvider({ children, ...props }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={undefined}
      disableTransitionOnChange
      {...props}
    >
      <InnerProvider>{children}</InnerProvider>
    </NextThemesProvider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}