import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts')

export const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const
export type Pillar = (typeof PILLARS)[number]

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  pillar: z.enum(PILLARS),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  draft: z.boolean().default(false),
  ogImage: z.string().optional(),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>

export interface Post {
  slug: string
  pillar: Pillar
  frontmatter: Frontmatter
  content: string
}

function readPost(pillar: Pillar, fileName: string): Post {
  const fullPath = path.join(CONTENT_DIR, pillar, fileName)
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatter = frontmatterSchema.parse(data)
  if (frontmatter.pillar !== pillar) {
    throw new Error(
      `Pillar mismatch in ${fullPath}: frontmatter.pillar is "${frontmatter.pillar}" but the file is located in the "${pillar}" directory. Move the file or fix its frontmatter so the two agree.`
    )
  }
  const slug = fileName.replace(/\.mdx$/, '')
  return { slug, pillar, frontmatter, content }
}

export function getAllPosts(includeDrafts = false): Post[] {
  const posts: Post[] = []
  for (const pillar of PILLARS) {
    const dir = path.join(CONTENT_DIR, pillar)
    if (!fs.existsSync(dir)) continue
    for (const fileName of fs.readdirSync(dir)) {
      if (!fileName.endsWith('.mdx')) continue
      const post = readPost(pillar, fileName)
      if (includeDrafts || !post.frontmatter.draft) posts.push(post)
    }
  }
  return posts.sort((a, b) => (a.frontmatter.publishedAt < b.frontmatter.publishedAt ? 1 : -1))
}

export function getPostsByPillar(pillar: Pillar): Post[] {
  return getAllPosts().filter((p) => p.pillar === pillar)
}

export function getPostBySlug(pillar: Pillar, slug: string): Post | null {
  const fullPath = path.join(CONTENT_DIR, pillar, `${slug}.mdx`)
  if (!fs.existsSync(fullPath)) return null
  return readPost(pillar, `${slug}.mdx`)
}
