import type { Article } from './articles'

/**
 * Parses a comma-separated keyword string into a deduplicated, trimmed
 * array. Empty tokens are dropped. The public site's frontmatter expects
 * `tags: [...]` as a YAML flow sequence, so order matters less than
 * uniqueness for SEO purposes -- but stable order helps when diffing
 * regenerated MDX files in git.
 */
export function parseKeywords(value: string | null | undefined): string[] {
  if (!value) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value.split(',')) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

export function buildFrontmatter(article: Article): string {
  if (!article.seoDescription) {
    throw new Error('Cannot publish: seoDescription is required (matches the public site\'s frontmatter schema)')
  }
  if (article.seoDescription.length > 160) {
    throw new Error(
      `Cannot publish: seoDescription is ${article.seoDescription.length} characters, exceeding the public site's 160-character limit`
    )
  }

  const title = article.seoTitle ?? article.title
  const publishedAt = (article.publishedAt ?? new Date().toISOString()).slice(0, 10)
  const tags = parseKeywords(article.seoKeywords)

  // Backslashes must be escaped BEFORE quotes -- escaping quotes first would
  // double-escape the backslashes just inserted by that step, and skipping
  // backslash-escaping entirely produces a double-quoted YAML scalar with an
  // invalid/unintended escape sequence for any title/description containing
  // a literal `\` (e.g. a Windows path), which the public site's YAML
  // parser could mis-parse or throw on at build time.
  const escapeYamlDoubleQuoted = (text: string): string =>
    text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  // Tags are emitted as a YAML flow sequence (single-line, comma-separated
  // inside square brackets) rather than block style so the rendered file
  // stays closer to hand-authored content. Each tag is double-quoted to
  // survive special characters -- matching the YAML scalar escaping for
  // title/description above.
  const tagsYaml = tags.length === 0 ? '[]' : `[${tags.map((t) => `"${escapeYamlDoubleQuoted(t)}"`).join(', ')}]`

  const lines = [
    '---',
    `title: "${escapeYamlDoubleQuoted(title)}"`,
    `description: "${escapeYamlDoubleQuoted(article.seoDescription)}"`,
    `pillar: "${article.pillar}"`,
    `tags: ${tagsYaml}`,
    `publishedAt: "${publishedAt}"`,
    'draft: false',
  ]
  if (article.coverImage) {
    lines.push(`ogImage: "${article.coverImage}"`)
  }
  lines.push('---', '')

  return lines.join('\n')
}
