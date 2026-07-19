interface YouTubeEmbedProps {
  url: string
}

// Extracts an 11-character YouTube video ID from either URL shape the CMS
// accepts (cms/lib/mdx-convert.ts's PROVIDER_HOSTNAMES['youtube'] allowlist):
// the long form `youtube.com/watch?v=<id>` and the short form
// `youtu.be/<id>`. Also defensively handles `/embed/<id>` and `/shorts/<id>`
// paths in case a writer pastes one of those instead.
//
// The CMS validates the URL's *hostname* before publishing, but never
// verifies it actually contains a resolvable video ID -- so this can still
// receive something like `https://youtube.com/watch` with no `v` param.
// Returns null rather than throwing so the caller can fall back instead of
// crashing (this repo is `output: 'export'`, so an uncaught render error on
// one article would fail the entire static build).
function extractVideoId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  let id: string | null = null
  if (parsed.hostname === 'youtu.be') {
    id = parsed.pathname.slice(1)
  } else {
    id = parsed.searchParams.get('v')
    if (!id) {
      const match = parsed.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)
      id = match ? match[1] : null
    }
  }

  if (!id || !/^[\w-]{11}$/.test(id)) return null
  return id
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const videoId = extractVideoId(url)

  if (!videoId) {
    // Malformed/unparseable video ID: render a plain fallback link instead
    // of a broken iframe or throwing.
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
  }

  return (
    <div className="relative w-full aspect-[16/9] my-6">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        className="absolute inset-0 h-full w-full rounded-lg"
        // No `allow-top-navigation`, `allow-forms`, or `allow-modals`: this
        // frame should be able to play video and go fullscreen, and nothing
        // more -- in particular it must not be able to navigate or otherwise
        // take over the parent page.
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
