export type ArticleStatus = 'draft' | 'published'
export type Pillar = 'ai' | 'technology' | 'productivity' | 'business'

export interface Article {
  id: string
  title: string
  slug: string
  pillar: Pillar
  status: ArticleStatus
  blocknoteContent: string
  seoTitle: string | null
  seoDescription: string | null
  coverImage: string | null
  authorId: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function rowToArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    pillar: row.pillar,
    status: row.status,
    blocknoteContent: row.blocknote_content,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    coverImage: row.cover_image,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

export async function createDraft(
  db: D1Database,
  input: { title: string; pillar: Pillar; authorId: string }
): Promise<Article> {
  const id = crypto.randomUUID()
  const slug = slugify(input.title)
  await db
    .prepare(
      `INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id)
       VALUES (?, ?, ?, ?, 'draft', '[]', ?)`
    )
    .bind(id, input.title, slug, input.pillar, input.authorId)
    .run()

  const created = await getArticleById(db, id)
  if (!created) throw new Error(`Failed to create article ${id}`)
  return created
}

export async function getArticleById(db: D1Database, id: string): Promise<Article | null> {
  const row = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first()
  return row ? rowToArticle(row) : null
}

export async function listArticles(db: D1Database, filter: { authorId?: string }): Promise<Article[]> {
  const result = filter.authorId
    ? await db.prepare('SELECT * FROM articles WHERE author_id = ? ORDER BY updated_at DESC').bind(filter.authorId).all()
    : await db.prepare('SELECT * FROM articles ORDER BY updated_at DESC').all()
  return result.results.map(rowToArticle)
}

export async function updateArticle(
  db: D1Database,
  id: string,
  patch: Partial<Pick<Article, 'title' | 'pillar' | 'blocknoteContent' | 'seoTitle' | 'seoDescription' | 'coverImage'>>
): Promise<Article> {
  const fields: string[] = []
  const values: unknown[] = []

  if (patch.title !== undefined) { fields.push('title = ?'); values.push(patch.title) }
  if (patch.pillar !== undefined) { fields.push('pillar = ?'); values.push(patch.pillar) }
  if (patch.blocknoteContent !== undefined) { fields.push('blocknote_content = ?'); values.push(patch.blocknoteContent) }
  if (patch.seoTitle !== undefined) { fields.push('seo_title = ?'); values.push(patch.seoTitle) }
  if (patch.seoDescription !== undefined) { fields.push('seo_description = ?'); values.push(patch.seoDescription) }
  if (patch.coverImage !== undefined) { fields.push('cover_image = ?'); values.push(patch.coverImage) }
  // Use millisecond-precision timestamp (not datetime('now'), which is
  // second-resolution) so updated_at reliably differs from created_at even
  // when a create+update happens within the same wall-clock second.
  fields.push("updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')")

  values.push(id)
  await db.prepare(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  const updated = await getArticleById(db, id)
  if (!updated) throw new Error(`Article ${id} not found after update`)
  return updated
}

export async function deleteArticleRow(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run()
}
