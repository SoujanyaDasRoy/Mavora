// Compiles blockNoteToMdx's output through the REAL MDX compiler
// (@mdx-js/mdx, the same compiler next-mdx-remote/rsc uses under the hood)
// and renders it to static HTML, proving end-to-end that malicious payloads
// are inert once actually compiled -- not just "the markdown string looks
// escaped". This is the strongest test for Finding 1 (whole-branch review):
// the public site renders published content via next-mdx-remote/rsc with no
// sanitization plugin and no `components` allowlist, so blockNoteToMdx's
// output IS the security boundary between writer-supplied text and live
// JSX/HTML on the public site.
//
// This lives at the repo root (not lib/) so it runs under vitest.config.mts's
// plain-Node "config" project rather than the "workers" project's workerd
// sandbox: @mdx-js/mdx's `run()` calls `new AsyncFunction(...)` to execute
// the compiled module body, and workerd disallows dynamic code generation
// ("EvalError: Code generation from strings disallowed for this context"),
// confirmed by spiking this exact call in the workers pool before writing
// this file. Regular Node has no such restriction.
import { describe, it, expect } from 'vitest'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { blockNoteToMdx } from './lib/mdx-convert'

async function renderMdx(source: string): Promise<string> {
  const compiled = await compile(source, { outputFormat: 'function-body' })
  const { default: Content } = await run(compiled, runtime as any)
  return renderToStaticMarkup(Content({}))
}

describe('blockNoteToMdx output compiled through the real MDX pipeline', () => {
  it('renders a <script> tag typed in plain paragraph text as inert escaped text, not a live element', async () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '<script>alert(1)</script>', styles: {} }],
      },
    ]
    const mdx = blockNoteToMdx(blocks)
    const html = await renderMdx(mdx)

    // The decisive check: no live <script ...> element exists in the
    // rendered HTML. The literal source text (as escaped entities) is
    // expected to still be present -- as inert text, not as markup.
    expect(html).not.toMatch(/<script[\s>]/)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('renders an iframe typed in plain paragraph text as inert text, not a live iframe element', async () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '<iframe src="https://evil.example.com"></iframe>', styles: {} }],
      },
    ]
    const mdx = blockNoteToMdx(blocks)
    const html = await renderMdx(mdx)

    expect(html).not.toMatch(/<iframe[\s>]/)
    expect(html).toContain('evil.example.com')
  })

  it('renders a JS expression typed in plain paragraph text as literal text, not an evaluated expression', async () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Balance: {7*6}', styles: {} }],
      },
    ]
    const mdx = blockNoteToMdx(blocks)
    const html = await renderMdx(mdx)

    // If braces were live MDX expressions, this would render "Balance: 42".
    // It must instead show the literal characters the writer typed.
    expect(html).not.toContain('Balance: 42')
    expect(html).toContain('Balance: {7*6}')
  })

  it('renders a link with a javascript: href as rejected at conversion time (never reaches the compiler)', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'link', href: 'javascript:alert(1)', content: [{ type: 'text', text: 'click', styles: {} }] }],
      },
    ]
    expect(() => blockNoteToMdx(blocks)).toThrow()
  })

  it('renders a normal https link as a real, functional <a href> element', async () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [
          { type: 'link', href: 'https://example.com/docs', content: [{ type: 'text', text: 'the docs', styles: {} }] },
        ],
      },
    ]
    const mdx = blockNoteToMdx(blocks)
    const html = await renderMdx(mdx)

    expect(html).toContain('<a href="https://example.com/docs">the docs</a>')
  })

  it('renders an image block as a real <img> element with the file name as alt text', async () => {
    const blocks = [
      { type: 'image', props: { url: 'https://media.example.com/cover.webp', name: 'a cover photo' } },
    ]
    const mdx = blockNoteToMdx(blocks)
    const html = await renderMdx(mdx)

    expect(html).toContain('<img src="https://media.example.com/cover.webp" alt="a cover photo"')
  })

  it('renders ordinary legitimate content (headings, bold, incidental <, >, {, } and a link) readably', async () => {
    const blocks = [
      { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'Comparing A vs B', styles: {} }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Use ', styles: {} },
          { type: 'text', text: 'a < b', styles: { bold: true } },
          { type: 'text', text: ' and {curly braces} in your notes. See the ', styles: {} },
          { type: 'link', href: 'https://example.com/guide', content: [{ type: 'text', text: 'guide', styles: {} }] },
          { type: 'text', text: ' for more.', styles: {} },
        ],
      },
    ]
    const mdx = blockNoteToMdx(blocks)
    const html = await renderMdx(mdx)

    expect(html).toContain('<h2>Comparing A vs B</h2>')
    expect(html).toContain('<strong>a &lt; b</strong>')
    expect(html).toContain('{curly braces}')
    expect(html).toContain('<a href="https://example.com/guide">guide</a>')
  })
})
