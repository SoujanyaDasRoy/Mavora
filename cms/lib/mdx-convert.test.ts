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
        content: [
          {
            type: 'link',
            href: 'https://example.com/a-real-page',
            content: [{ type: 'text', text: 'a link', styles: {} }],
          },
        ],
      },
    ]
    expect(blockNoteToMdx(blocks)).toBe('[a link](https://example.com/a-real-page)')
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

  // Finding 1 (whole-branch review): plain paragraph text was the one path
  // that reached the MDX compiler with zero protection against MDX/JSX
  // syntax -- a writer could type `<iframe src="evil">` or `{fetch(...)}` in
  // an ordinary paragraph (no "embed" block needed) and it would compile as
  // live JSX/an evaluated expression on the public site, completely
  // bypassing the embed allowlist below. These lock in the fix at the
  // markdown-string level; mdx-render.test.ts proves the same payloads are
  // inert once actually compiled and rendered through @mdx-js/mdx.
  it('escapes MDX-significant characters (< > { } &) in plain text as numeric character references', () => {
    const blocks = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Use <script>alert(1)</script> and {1+1} and Q&A', styles: {} }] },
    ]
    expect(blockNoteToMdx(blocks)).toBe('Use &#60;script&#62;alert(1)&#60;/script&#62; and &#123;1+1&#125; and Q&#38;A')
  })

  it('does not double-escape the ampersand introduced by its own entity output', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: '<', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('&#60;')
  })

  it('rejects a link whose href is not http/https (e.g. javascript:)', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'link', href: 'javascript:alert(1)', content: [{ type: 'text', text: 'click me', styles: {} }] }],
      },
    ]
    expect(() => blockNoteToMdx(blocks)).toThrow(/http/i)
  })

  it('rejects a link with a malformed href', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'link', href: 'not a url', content: [{ type: 'text', text: 'click me', styles: {} }] }],
      },
    ]
    expect(() => blockNoteToMdx(blocks)).toThrow(/valid url/i)
  })

  it('percent-encodes parens in a link href so a stray ")" cannot terminate the link destination early', () => {
    const payload = 'https://example.com/x)evil-trailer'
    const blocks = [
      { type: 'paragraph', content: [{ type: 'link', href: payload, content: [{ type: 'text', text: 'link', styles: {} }] }] },
    ]
    const result = blockNoteToMdx(blocks)
    // The whole line must be a single, well-formed markdown link destination
    // -- no raw, unescaped ')' inside it that would terminate the
    // destination early and leave "evil-trailer)" dangling as sibling text.
    expect(result).toMatch(/^\[link\]\([^)]*\)$/)
    expect(result).toContain('%29')
    expect(result).not.toContain(')evil-trailer')
  })

  it('still renders ordinary content with incidental <, >, {, } and a normal https link readably', () => {
    const blocks = [
      { type: 'paragraph', content: [{ type: 'text', text: 'a < b and c > d, plus {curly} notes', styles: {} }] },
      {
        type: 'paragraph',
        content: [
          { type: 'link', href: 'https://example.com/docs', content: [{ type: 'text', text: 'the docs', styles: {} }] },
        ],
      },
    ]
    const result = blockNoteToMdx(blocks)
    expect(result).toContain('a &#60; b and c &#62; d, plus &#123;curly&#125; notes')
    expect(result).toContain('[the docs](https://example.com/docs)')
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

  // Finding 2 (whole-branch review): blockNoteToMdx had no `case 'image'`,
  // so image blocks silently fell through to `default` and vanished from
  // published content. `name` is BlockNote's file-name prop, which is also
  // what BlockNote itself renders as the <img> alt attribute (see
  // node_modules/@blocknote/core/src/blocks/Image/block.ts imageRender).
  it('converts an image block to Markdown image syntax, using the file name as alt text', () => {
    const blocks = [{ type: 'image', props: { url: 'https://media.example.com/articles/a1/cover.webp', name: 'cover shot' } }]
    expect(blockNoteToMdx(blocks)).toBe('![cover shot](https://media.example.com/articles/a1/cover.webp)')
  })

  it('converts an image block with no name to empty alt text rather than throwing', () => {
    const blocks = [{ type: 'image', props: { url: 'https://media.example.com/articles/a1/cover.webp' } }]
    expect(blockNoteToMdx(blocks)).toBe('![](https://media.example.com/articles/a1/cover.webp)')
  })

  it('rejects an image block whose url is not http/https', () => {
    const blocks = [{ type: 'image', props: { url: 'javascript:alert(1)', name: 'x' } }]
    expect(() => blockNoteToMdx(blocks)).toThrow(/http/i)
  })
})
