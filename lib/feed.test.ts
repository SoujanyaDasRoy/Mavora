import { describe, it, expect } from 'vitest'
import { escapeXml, buildFeedXml } from './feed'
import type { Post } from './content'

describe('escapeXml', () => {
  it('escapes & first, then <, >, ", \'', () => {
    expect(escapeXml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    expect(escapeXml('<script>')).toBe('&lt;script&gt;')
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;')
    expect(escapeXml("it's")).toBe('it&apos;s')
  })

  it('does not double-escape the ampersand introduced by escaping other characters', () => {
    // If '&' were escaped after '<'/'>'/etc, the '&' inserted by escaping
    // '<' would itself get turned into '&amp;amp;lt;' -- assert that doesn't happen.
    expect(escapeXml('<')).toBe('&lt;')
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;')
  })

  it('leaves plain text untouched', () => {
    expect(escapeXml('Plain title, no special chars.')).toBe('Plain title, no special chars.')
  })
})

describe('buildFeedXml', () => {
  const specialCharsPost: Post = {
    slug: 'special-chars-post',
    pillar: 'ai',
    frontmatter: {
      title: `Ben & Jerry's <Review> "Best" Flavors`,
      description: `A & B < C > D, "quoted" and it's great`,
      pillar: 'ai',
      tags: [],
      publishedAt: '2026-07-18',
      draft: false,
    },
    content: '',
  }

  it('escapes special characters in title and description so the feed is valid XML', () => {
    const xml = buildFeedXml([specialCharsPost])

    // Exact escaped string assertions.
    expect(xml).toContain(
      '<title>Ben &amp; Jerry&apos;s &lt;Review&gt; &quot;Best&quot; Flavors</title>'
    )
    expect(xml).toContain(
      '<description>A &amp; B &lt; C &gt; D, &quot;quoted&quot; and it&apos;s great</description>'
    )

    // The raw, unescaped strings must never appear -- that would mean the
    // dangerous characters leaked through unescaped.
    expect(xml).not.toContain(specialCharsPost.frontmatter.title)
    expect(xml).not.toContain(specialCharsPost.frontmatter.description)
  })

  it('produces no bare "&", "<", or ">" inside element text content (well-formedness check)', () => {
    // No dedicated XML parser is a project dependency (checked package.json /
    // node_modules: no jsdom/xmldom/fast-xml-parser), so this test proves
    // well-formedness directly: every "&" in the output must start a known
    // entity, and no raw "<" or ">" may appear except as tag delimiters or
    // inside a "&lt;"/"&gt;" entity.
    const xml = buildFeedXml([specialCharsPost])

    // Every '&' must begin one of the five predefined XML entities.
    const bareAmpersand = /&(?!amp;|lt;|gt;|quot;|apos;)/
    expect(bareAmpersand.test(xml)).toBe(false)

    // Strip real tags (e.g. "<title>", "</item>") and confirm no stray '<' or
    // '>' remain -- any that do would have to come from unescaped content.
    const withoutTags = xml.replace(/<\/?[a-zA-Z][\w-]*(?:\s[^<>]*)?>/g, '').replace(/<\?xml[^>]*\?>/, '')
    expect(withoutTags).not.toMatch(/[<>]/)
  })

  it('does not touch pubDate (a Date.toUTCString() result) or the static channel title/description', () => {
    const xml = buildFeedXml([specialCharsPost])
    expect(xml).toContain(new Date(specialCharsPost.frontmatter.publishedAt).toUTCString())
    expect(xml).toContain('<title>Mavora</title>')
    expect(xml).toContain(
      '<description>Technology, AI, productivity and business, explained practically.</description>'
    )
  })
})
