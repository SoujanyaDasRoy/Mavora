'use client'

import { useEffect, useRef } from 'react'
import { isSafeHttpUrl } from '@/lib/safe-url'

interface TwitterEmbedProps {
  url: string
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void
      }
    }
  }
}

const WIDGETS_SCRIPT_SRC = 'https://platform.twitter.com/widgets.js'

function loadTwitterWidgetsScript(): void {
  // Multiple TwitterEmbeds can appear on the same article -- only inject
  // the script once no matter how many instances mount.
  if (document.querySelector(`script[src="${WIDGETS_SCRIPT_SRC}"]`)) return
  const script = document.createElement('script')
  script.src = WIDGETS_SCRIPT_SRC
  script.async = true
  script.charset = 'utf-8'
  document.body.appendChild(script)
}

export function TwitterEmbed({ url }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.twttr?.widgets) {
      // widgets.js is already loaded (e.g. from an earlier TwitterEmbed on
      // this page) -- ask it to scan this component's own container rather
      // than relying on its automatic first-load document scan, which has
      // already happened by now.
      window.twttr.widgets.load(containerRef.current ?? undefined)
      return
    }

    loadTwitterWidgetsScript()

    // widgets.js sets `window.twttr` itself once it finishes loading, and
    // performs one automatic scan of the document at that point. Poll
    // briefly for it to appear (handles both "script still downloading" and
    // "script tag already existed from another instance but hasn't
    // finished loading yet") and then explicitly process this container, in
    // case this component mounted after that automatic scan already ran.
    let cancelled = false
    const start = Date.now()
    const poll = () => {
      if (cancelled) return
      if (window.twttr?.widgets) {
        window.twttr.widgets.load(containerRef.current ?? undefined)
        return
      }
      if (Date.now() - start < 10000) {
        setTimeout(poll, 100)
      }
    }
    poll()

    return () => {
      cancelled = true
    }
  }, [])

  // The CMS validates this URL's hostname/protocol before publishing, but
  // this component doesn't blindly trust that upstream check held -- `url`
  // reaches an `href` here, so it's re-validated locally as an http(s) URL
  // before ever being used as one. `new URL('javascript:...')` parses
  // without throwing and React does not block `javascript:` hrefs, so
  // skipping this check would make a CMS allowlist bypass a live XSS.
  const safeUrl = isSafeHttpUrl(url)

  return (
    <div ref={containerRef} className="my-6">
      <blockquote className="twitter-tweet">
        {safeUrl ? <a href={url}>{url}</a> : <span>{url}</span>}
      </blockquote>
    </div>
  )
}
