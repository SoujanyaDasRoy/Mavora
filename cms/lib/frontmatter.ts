import type { Article } from './articles'

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

  // Backslashes must be escaped BEFORE quotes -- escaping quotes first would
  // double-escape the backslashes just inserted by that step, and skipping
  // backslash-escaping entirely produces a double-quoted YAML scalar with an
  // invalid/unintended escape sequence for any title/description containing
  // a literal `\` (e.g. a Windows path), which the public site's YAML
  // parser could mis-parse or throw on at build time.
  const escapeYamlDoubleQuoted = (text: string): string =>
    text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const lines = [
    '---',
    `title: "${escapeYamlDoubleQuoted(title)}"`,
    `description: "${escapeYamlDoubleQuoted(article.seoDescription)}"`,
    `pillar: "${article.pillar}"`,
    'tags: []',
    `publishedAt: "${publishedAt}"`,
    'draft: false',
  ]
  if (article.coverImage) {
    lines.push(`ogImage: "${article.coverImage}"`)
  }
  lines.push('---', '')

  return lines.join('\n')
}
