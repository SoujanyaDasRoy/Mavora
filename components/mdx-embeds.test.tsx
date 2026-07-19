// Compiles MDX containing `<YouTubeEmbed url="..." />` and
// `<TwitterEmbed url="..." />` -- the EXACT JSX shape cms/lib/mdx-convert.ts's
// renderEmbed() emits (confirmed by reading that file:
// ``<${componentName} url="${escapeAttribute(url)}" />``, where
// componentName is either "YouTubeEmbed" or "TwitterEmbed" and `url` is the
// only prop that ever reaches the rendered JSX -- no `provider` prop) --
// through the REAL MDX compiler (@mdx-js/mdx, the same compiler
// next-mdx-remote/rsc uses under the hood, see node_modules/next-mdx-remote's
// own dependency on it) with these components registered.
//
// This is the regression test for the bug this file's sibling components
// fix: app/[pillar]/[slug]/page.tsx renders `<MDXRemote source={post.content} />`
// with no `components` prop, and this repo builds with `output: 'export'`
// (next.config.js) -- so an article containing either embed tag would throw
// a reference error during the static export and fail the *entire* build,
// not just that one page.
import { describe, it, expect } from 'vitest'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { YouTubeEmbed } from './YouTubeEmbed'
import { TwitterEmbed } from './TwitterEmbed'

// `components` is typed loosely here to match the loose object literals used
// by the tests below (`{ YouTubeEmbed }`, `{ YouTubeEmbed, TwitterEmbed }`) --
// the real type safety this test suite cares about is that these components
// resolve and render correctly through the compiler, not the TS shape of an
// MDXComponents map.
async function renderMdx(
  source: string,
  components: Record<string, (props: { url: string }) => unknown>
): Promise<string> {
  const compiled = await compile(source, { outputFormat: 'function-body' })
  const { default: Content } = await run(compiled, runtime as any)
  return renderToStaticMarkup(Content({ components }))
}

describe('MDX embed components resolve through the real MDX pipeline', () => {
  // RED: reproduces the original bug. Without `components` registered (the
  // state of app/[pillar]/[slug]/page.tsx before this fix), MDX cannot
  // resolve the `YouTubeEmbed` identifier and throws instead of rendering.
  it('without components registered, a published <YouTubeEmbed> tag throws instead of rendering', async () => {
    const mdx = '<YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />'
    const compiled = await compile(mdx, { outputFormat: 'function-body' })
    const { default: Content } = await run(compiled, runtime as any)

    expect(() => renderToStaticMarkup(Content({}))).toThrow()
  })

  it('without components registered, a published <TwitterEmbed> tag throws instead of rendering', async () => {
    const mdx = '<TwitterEmbed url="https://twitter.com/someuser/status/123456789" />'
    const compiled = await compile(mdx, { outputFormat: 'function-body' })
    const { default: Content } = await run(compiled, runtime as any)

    expect(() => renderToStaticMarkup(Content({}))).toThrow()
  })

  // GREEN: with the components wired up (as app/[pillar]/[slug]/page.tsx
  // now does via `<MDXRemote components={{ YouTubeEmbed, TwitterEmbed }} />`),
  // the same tags compile and render successfully.
  it('compiles a <YouTubeEmbed url="..." /> tag into a real, playable iframe', async () => {
    const mdx = '<YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />'
    const html = await renderMdx(mdx, { YouTubeEmbed })

    expect(html).toContain('<iframe')
    expect(html).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ"')
    expect(html).toMatch(/allow[Ff]ull[Ss]creen/)
  })

  it('compiles a <YouTubeEmbed url="..." /> tag using the youtu.be short URL shape', async () => {
    const mdx = '<YouTubeEmbed url="https://youtu.be/dQw4w9WgXcQ" />'
    const html = await renderMdx(mdx, { YouTubeEmbed })

    expect(html).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ"')
  })

  it('compiles a <TwitterEmbed url="..." /> tag into a real tweet blockquote with a fallback link', async () => {
    const mdx = '<TwitterEmbed url="https://twitter.com/someuser/status/123456789" />'
    const html = await renderMdx(mdx, { TwitterEmbed })

    expect(html).toContain('twitter-tweet')
    expect(html).toContain('href="https://twitter.com/someuser/status/123456789"')
  })

  it('compiles an article-shaped MDX document mixing prose and both embed tags without throwing', async () => {
    const mdx = [
      '# My Article',
      '',
      'Some intro text.',
      '',
      '<YouTubeEmbed url="https://youtu.be/dQw4w9WgXcQ" />',
      '',
      'More text in between.',
      '',
      '<TwitterEmbed url="https://x.com/someuser/status/987654321" />',
    ].join('\n')

    const html = await renderMdx(mdx, { YouTubeEmbed, TwitterEmbed })

    expect(html).toContain('<h1>My Article</h1>')
    expect(html).toContain('<iframe')
    expect(html).toContain('twitter-tweet')
  })

  it('YouTubeEmbed renders a fallback link instead of throwing when no video ID can be extracted', () => {
    const html = renderToStaticMarkup(<YouTubeEmbed url="https://www.youtube.com/watch" />)
    expect(html).not.toContain('<iframe')
    expect(html).toContain('<a')
    expect(html).toContain('https://www.youtube.com/watch')
  })
})
