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

function escapeMarkdown(text: string): string {
  return text.replace(/([*_`[\]])/g, '\\$1')
}

function renderInline(inline: Inline): string {
  if (inline.type === 'link') {
    const label = inline.content.map(renderInline).join('')
    return `[${label}](${inline.href})`
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
  const componentName = provider === 'youtube' ? 'YouTubeEmbed' : 'TwitterEmbed'
  return `<${componentName} url="${url}" />`
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
      default:
        lines.push(renderInlineList(raw.content))
    }
  }
  flushList()

  return lines.join('\n\n')
}
