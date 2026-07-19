// Shared by components/YouTubeEmbed.tsx and components/TwitterEmbed.tsx, both
// of which need to place a CMS-supplied `url` string into an `<a href>`.
//
// The CMS (cms/lib/mdx-convert.ts's PROVIDER_HOSTNAMES allowlist) validates
// the hostname/protocol of these URLs before ever emitting the embed tags --
// but these components render straight from published MDX and shouldn't
// blindly trust that upstream check held. `new URL('javascript:alert(1)')`
// parses without throwing (the WHATWG URL parser accepts any registered or
// unregistered scheme), and React does not block `javascript:` hrefs (it
// only warns in dev) -- so without this check, a bypass of the CMS's
// allowlist would be a live, reflected XSS vector here.
//
// Only `http:`/`https:` are ever legitimate for a YouTube or Twitter/X URL,
// so this intentionally rejects everything else (`javascript:`, `data:`,
// `vbscript:`, `file:`, relative/unparseable strings, etc.) rather than
// trying to maintain a blocklist.
export function isSafeHttpUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}
