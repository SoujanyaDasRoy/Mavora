import { describe, it, expect } from 'vitest'
import { blockNoteToMdx } from './mdx-convert'

describe('blockNoteToMdx', () => {
  it('converts a paragraph with plain text', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('Hello world')
  })

  it('converts headings h1 through h3', () => {
    const blocks = [
      { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: 'Title', styles: {} }] },
      { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'Subtitle', styles: {} }] },
      { type: 'heading', props: { level: 3 }, content: [{ type: 'text', text: 'Section', styles: {} }] },
    ]
    const result = blockNoteToMdx(blocks)
    expect(result).toContain('# Title')
    expect(result).toContain('## Subtitle')
    expect(result).toContain('### Section')
  })

  it('converts bold and italic text', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'bold', styles: { bold: true } },
          { type: 'text', text: ' and ', styles: {} },
          { type: 'text', text: 'italic', styles: { italic: true } },
        ],
      },
    ]
    expect(blockNoteToMdx(blocks)).toBe('**bold** and *italic*')
  })

  it('converts a link', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'link', href: 'https://example.com', content: [{ type: 'text', text: 'a link', styles: {} }] }],
      },
    ]
    expect(blockNoteToMdx(blocks)).toBe('[a link](https://example.com)')
  })

  it('converts a bullet list', () => {
    const blocks = [
      { type: 'bulletListItem', content: [{ type: 'text', text: 'First', styles: {} }] },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Second', styles: {} }] },
    ]
    expect(blockNoteToMdx(blocks)).toBe('- First\n- Second')
  })

  it('converts a numbered list', () => {
    const blocks = [
      { type: 'numberedListItem', content: [{ type: 'text', text: 'First', styles: {} }] },
      { type: 'numberedListItem', content: [{ type: 'text', text: 'Second', styles: {} }] },
    ]
    expect(blockNoteToMdx(blocks)).toBe('1. First\n2. Second')
  })

  it('converts a blockquote', () => {
    const blocks = [{ type: 'quote', content: [{ type: 'text', text: 'A quote', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('> A quote')
  })

  it('converts inline code', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: 'const x = 1', styles: { code: true } }] }]
    expect(blockNoteToMdx(blocks)).toBe('`const x = 1`')
  })

  it('escapes markdown-special characters in plain text so they render literally', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: 'Use * and _ carefully', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('Use \\* and \\_ carefully')
  })

  it('converts a table to a Markdown table', () => {
    const blocks = [
      {
        type: 'table',
        content: {
          rows: [
            { cells: [[{ type: 'text', text: 'Name', styles: {} }], [{ type: 'text', text: 'Role', styles: {} }]] },
            { cells: [[{ type: 'text', text: 'Ada', styles: {} }], [{ type: 'text', text: 'Admin', styles: {} }]] },
          ],
        },
      },
    ]
    const result = blockNoteToMdx(blocks)
    expect(result).toBe('| Name | Role |\n| --- | --- |\n| Ada | Admin |')
  })

  it('converts an allowlisted YouTube embed to a sandboxed iframe component', () => {
    const blocks = [{ type: 'embed', props: { provider: 'youtube', url: 'https://youtube.com/watch?v=abc123' } }]
    const result = blockNoteToMdx(blocks)
    expect(result).toContain('<YouTubeEmbed url="https://youtube.com/watch?v=abc123" />')
  })

  it('converts an allowlisted Twitter embed', () => {
    const blocks = [{ type: 'embed', props: { provider: 'twitter', url: 'https://twitter.com/user/status/123' } }]
    const result = blockNoteToMdx(blocks)
    expect(result).toContain('<TwitterEmbed url="https://twitter.com/user/status/123" />')
  })

  it('throws on a non-allowlisted embed provider rather than emitting raw HTML', () => {
    const blocks = [{ type: 'embed', props: { provider: 'arbitrary-iframe', url: 'https://evil.example.com' } }]
    expect(() => blockNoteToMdx(blocks)).toThrow(/not allowed/i)
  })

  it('escapes a quote-breakout payload in the embed url rather than injecting raw markup', () => {
    const payload = 'https://youtube.com/x" /><script>alert(1)</script><YouTubeEmbed url="'
    const blocks = [{ type: 'embed', props: { provider: 'youtube', url: payload } }]
    const result = blockNoteToMdx(blocks)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('"/>')
    expect(result).toContain('&quot;')
    expect(result).toMatch(/^<YouTubeEmbed url="[^"]*" \/>$/)
  })

  it('throws when a youtube-provider embed url does not point to a youtube hostname', () => {
    const blocks = [{ type: 'embed', props: { provider: 'youtube', url: 'https://evil.example.com/video' } }]
    expect(() => blockNoteToMdx(blocks)).toThrow(/hostname/i)
  })

  it('throws when a twitter-provider embed url does not point to a twitter/x hostname', () => {
    const blocks = [{ type: 'embed', props: { provider: 'twitter', url: 'https://evil.example.com/status/1' } }]
    expect(() => blockNoteToMdx(blocks)).toThrow(/hostname/i)
  })
})
