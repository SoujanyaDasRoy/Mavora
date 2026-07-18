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

  const lines = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${article.seoDescription.replace(/"/g, '\\"')}"`,
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
