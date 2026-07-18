import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

const PAGES_DIR = path.join(process.cwd(), 'content', 'pages')

const pageFrontmatterSchema = z.object({
  title: z.string().min(1),
})

export interface StaticPage {
  slug: string
  title: string
  content: string
}

export function getPageBySlug(slug: string): StaticPage | null {
  const fullPath = path.join(PAGES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(fullPath)) return null
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { data, content } = matter(raw)
  const { title } = pageFrontmatterSchema.parse(data)
  return { slug, title, content }
}
