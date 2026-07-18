interface TextInline {
  type: 'text'
  text: string
  styles: { bold?: boolean; italic?: boolean; code?: boolean }
}

interface LinkInline {
  type: 'link'
  href: string
  content: TextInline[]
}

type Inline = TextInline | LinkInline

interface Block {
  type: string
  props?: Record<string, unknown>
  content?: Inline[]
}

interface TableCell {
  cells: Inline[][]
}

interface TableContent {
  rows: TableCell[]
}

const ALLOWED_EMBED_PROVIDERS = new Set(['youtube', 'twitter'])

const PROVIDER_HOSTNAMES: Record<string, Set<string>> = {
  youtube: new Set(['youtube.com', 'www.youtube.com', 'youtu.be']),
  twitter: new Set(['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com']),
}

function escapeAttribute(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Plain text rendered into MDX source has to be safe against TWO different
// grammars at once: Markdown's own special characters (handled by the
// trailing backslash-escape pass, unchanged from before) AND MDX's JSX/
// expression syntax, which repurposes `<`, `>`, `{`, `}` as the start of a
// live component/tag or a live JS expression -- backslash-escaping does NOT
// neutralize those for MDX (`\<` is still tag-like to MDX's tokenizer), so
// they need a different mechanism: HTML numeric character references
// (`&#60;` etc). Verified empirically (see lib/mdx-convert.test.ts and
// mdx-render.test.ts) that MDX/micromark only interprets literal `<` / `{`
// characters encountered while tokenizing raw source; a numeric character
// reference is invisible to that tokenizer (it's the five/six literal
// characters `&`, `#`, digits, `;`) and only gets decoded to the real
// character during final text-node rendering -- by which point structural
// parsing has already finished, so the decoded `<script>` or `{1+1}` is
// inert text, never a tag or an evaluated expression. `&` is escaped first
// (before the other entities are introduced) so this function never
// double-escapes its own output.
function escapeMarkdown(text: string): string {
  return text
    .replace(/&/g, '&#38;')
    .replace(/</g, '&#60;')
    .replace(/>/g, '&#62;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/([*_`[\]])/g, '\\$1')
}

// Validates a user-supplied URL (link href or image src) the same way
// renderEmbed validates embed URLs -- must parse as a well-formed absolute
// URL and use http/https (rejects `javascript:`, `data:`, bare/relative
// paths, etc). Unlike embed URLs, the destination isn't restricted to a
// provider allowlist of hostnames, since links/images can point anywhere on
// the web.
//
// After validation, `(` and `)` are percent-encoded in the *normalized*
// URL. `new URL()` already percent-encodes whitespace and the characters
// that are dangerous in an MDX/HTML context (`<`, `>`, `"`, `` ` ``,
// verified empirically), but it leaves literal `(`/`)` untouched (they're
// valid, unreserved-adjacent URL characters) -- and those are exactly the
// characters that break out of Markdown's `[label](url)` destination
// syntax (an unescaped/unbalanced `)` ends the link early). Percent-encoding
// them is semantically lossless (a URL consumer decodes %28/%29 back to the
// literal characters) and keeps the destination on a single line with no
// unbalanced parens for the Markdown parser to trip over.
function resolveLinkUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`URL "${url}" is not a valid URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`URL "${url}" must use http or https`)
  }
  return parsed.href.replace(/\(/g, '%28').replace(/\)/g, '%29')
}

function renderInline(inline: Inline): string {
  if (inline.type === 'link') {
    const label = inline.content.map(renderInline).join('')
    return `[${label}](${resolveLinkUrl(inline.href)})`
  }
  if (inline.styles.code) return `\`${inline.text}\``
  let text = escapeMarkdown(inline.text)
  if (inline.styles.bold) text = `**${text}**`
  if (inline.styles.italic) text = `*${text}*`
  return text
}

function renderInlineList(content: Inline[] | undefined): string {
  return (content ?? []).map(renderInline).join('')
}

function renderTable(content: TableContent): string {
  const rows = content.rows.map((row) => row.cells.map((cell) => renderInlineList(cell)))
  const [header, ...body] = rows
  const headerLine = `| ${header.join(' | ')} |`
  const separatorLine = `| ${header.map(() => '---').join(' | ')} |`
  const bodyLines = body.map((row) => `| ${row.join(' | ')} |`)
  return [headerLine, separatorLine, ...bodyLines].join('\n')
}

function renderEmbed(props: Record<string, unknown> | undefined): string {
  const provider = String(props?.provider ?? '')
  const url = String(props?.url ?? '')
  if (!ALLOWED_EMBED_PROVIDERS.has(provider)) {
    throw new Error(`Embed provider "${provider}" is not allowed`)
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error(`Embed url "${url}" is not a valid URL`)
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`Embed url "${url}" must use http or https`)
  }

  const allowedHostnames = PROVIDER_HOSTNAMES[provider]
  if (!allowedHostnames.has(parsedUrl.hostname)) {
    throw new Error(`Embed url "${url}" hostname does not match provider "${provider}"`)
  }

  const componentName = provider === 'youtube' ? 'YouTubeEmbed' : 'TwitterEmbed'
  return `<${componentName} url="${escapeAttribute(url)}" />`
}

export function blockNoteToMdx(blocks: unknown[]): string {
  const lines: string[] = []
  let listBuffer: string[] = []
  let listOrdered = false

  function flushList() {
    if (listBuffer.length === 0) return
    lines.push(listBuffer.join('\n'))
    listBuffer = []
  }

  for (const raw of blocks as Block[]) {
    if (raw.type === 'bulletListItem' || raw.type === 'numberedListItem') {
      const ordered = raw.type === 'numberedListItem'
      if (listBuffer.length > 0 && ordered !== listOrdered) flushList()
      listOrdered = ordered
      const marker = ordered ? `${listBuffer.length + 1}.` : '-'
      listBuffer.push(`${marker} ${renderInlineList(raw.content)}`)
      continue
    }

    flushList()

    switch (raw.type) {
      case 'paragraph':
        lines.push(renderInlineList(raw.content))
        break
      case 'heading': {
        const level = Number(raw.props?.level ?? 1)
        lines.push(`${'#'.repeat(level)} ${renderInlineList(raw.content)}`)
        break
      }
      case 'quote':
        lines.push(`> ${renderInlineList(raw.content)}`)
        break
      case 'table':
        lines.push(renderTable(raw.content as unknown as TableContent))
        break
      case 'embed':
        lines.push(renderEmbed(raw.props))
        break
      case 'image': {
        // BlockNote's image block props (node_modules/@blocknote/core/src/blocks/Image/block.ts):
        // `name` is the file name and is what BlockNote itself uses as the
        // rendered <img>'s alt text (see imageRender/imageToExternalHTML in
        // that file), so it's the closest thing to writer-supplied alt text
        // this block type has -- `caption` is a distinct, visible caption
        // *below* the image, not alt text, so it isn't used here.
        const alt = escapeMarkdown(String(raw.props?.name ?? ''))
        const url = resolveLinkUrl(String(raw.props?.url ?? ''))
        lines.push(`![${alt}](${url})`)
        break
      }
      default:
        lines.push(renderInlineList(raw.content))
    }
  }
  flushList()

  return lines.join('\n\n')
}
