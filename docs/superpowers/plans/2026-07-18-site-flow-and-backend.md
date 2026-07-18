# Mavora Site Flow & Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Mavora's content flow (MDX → static pages → SEO surfaces) and its "backend" (form handling, deployment) with zero custom servers and zero paid services.

**Architecture:** Next.js App Router with `output: 'export'` (fully static site, no Node server at runtime), deployed to Cloudflare Pages. Content lives as MDX files in the git repo — publishing is `git push`, not a CMS action. The only two dynamic touchpoints (contact form, newsletter signup) are delegated to free third-party hosted services (Formspree, Buttondown) so no API routes, no database, and no server-side code are needed anywhere.

**Tech Stack:** Next.js 14 (App Router, static export), TypeScript, `gray-matter` (frontmatter parsing), `zod` (frontmatter validation), Vitest (unit tests), Cloudflare Pages (hosting), Formspree (contact form, free tier), Buttondown (email capture, free tier).

## Global Constraints

- Budget: $0. No paid services. Domain is the only near-unavoidable cost and is out of scope for this plan.
- Solo maintainer. No login, no roles, no CMS admin UI.
- No custom backend server, no database (Cloudflare D1/Workers/R2 explicitly out of scope per PRD v1.2).
- Content pillars (fixed enum): `ai`, `technology`, `productivity`, `business` — per PRD Content Pillars.
- Hosting: Cloudflare Pages, static export only.
- Every content file needs SEO frontmatter (title, description) per PRD SEO Requirements.

---

## File Structure

```
mavora/
  content/
    posts/
      ai/<slug>.mdx
      technology/<slug>.mdx
      productivity/<slug>.mdx
      business/<slug>.mdx
    pages/
      about.mdx
      editorial-standards.mdx
      privacy.mdx
      terms.mdx
      affiliate-disclosure.mdx
  lib/
    content.ts       # post loader + frontmatter schema
    pages.ts          # static page loader
  app/
    page.tsx                          # homepage
    [pillar]/page.tsx                 # category page
    [pillar]/[slug]/page.tsx          # article page
    about/page.tsx
    contact/page.tsx
    editorial-standards/page.tsx
    privacy/page.tsx
    terms/page.tsx
    affiliate-disclosure/page.tsx
    sitemap.ts
    robots.ts
    feed.xml/route.ts
  components/
    ContactForm.tsx
    NewsletterSignup.tsx
  next.config.js
  wrangler.toml (or Cloudflare Pages dashboard config — see Task 8)
  package.json
  vitest.config.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx` (placeholder, replaced in Task 4)
- Test: `lib/sanity.test.ts`

**Interfaces:**
- Produces: static export build pipeline (`npm run build` → `out/` directory) that every later task builds on.

- [ ] **Step 1: Initialize the Next.js project**

```bash
npx create-next-app@latest mavora --typescript --app --no-tailwind --no-eslint --src-dir=false --import-alias "@/*"
cd mavora
```

- [ ] **Step 2: Configure static export**

`next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

module.exports = nextConfig
```

- [ ] **Step 3: Install content and test dependencies**

```bash
npm install gray-matter zod
npm install -D vitest
```

- [ ] **Step 4: Add Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

Add to `package.json` scripts:
```json
"test": "vitest run"
```

- [ ] **Step 5: Write a sanity test to prove the pipeline works**

`lib/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run the test**

Run: `npm test`
Expected: PASS (1 test)

- [ ] **Step 7: Verify the build produces static output**

Run: `npm run build`
Expected: `out/` directory created containing `index.html`

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js static export project"
```

---

### Task 2: Post Content Schema & Loader

**Files:**
- Create: `lib/content.ts`
- Create: `content/posts/ai/example-post.mdx` (fixture used by tests and by Task 4)
- Test: `lib/content.test.ts`

**Interfaces:**
- Consumes: nothing (reads filesystem directly)
- Produces:
  - `PILLARS: readonly ['ai', 'technology', 'productivity', 'business']`
  - `type Pillar = typeof PILLARS[number]`
  - `interface Post { slug: string; pillar: Pillar; frontmatter: Frontmatter; content: string }`
  - `getAllPosts(includeDrafts?: boolean): Post[]` — sorted newest first by `publishedAt`
  - `getPostsByPillar(pillar: Pillar): Post[]`
  - `getPostBySlug(pillar: Pillar, slug: string): Post | null`

- [ ] **Step 1: Create a fixture post**

`content/posts/ai/example-post.mdx`:
```mdx
---
title: "Example AI Post"
description: "A short description used for SEO meta tags."
pillar: "ai"
tags: ["example"]
publishedAt: "2026-07-18"
draft: false
---

This is the body of the example post.
```

- [ ] **Step 2: Write the failing test**

`lib/content.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getAllPosts, getPostsByPillar, getPostBySlug } from './content'

describe('content loader', () => {
  it('loads all non-draft posts sorted newest first', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    expect(posts[0].frontmatter.title).toBeDefined()
  })

  it('filters posts by pillar', () => {
    const posts = getPostsByPillar('ai')
    expect(posts.every((p) => p.pillar === 'ai')).toBe(true)
  })

  it('loads a single post by slug', () => {
    const post = getPostBySlug('ai', 'example-post')
    expect(post).not.toBeNull()
    expect(post?.frontmatter.title).toBe('Example AI Post')
  })

  it('returns null for a missing slug', () => {
    const post = getPostBySlug('ai', 'does-not-exist')
    expect(post).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './content'"

- [ ] **Step 4: Implement the loader**

`lib/content.ts`:
```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests in `lib/content.test.ts`, plus the Task 1 sanity test)

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts lib/content.test.ts content/posts/ai/example-post.mdx
git commit -m "feat: add MDX post schema and loader"
```

---

### Task 3: Static Page Loader (About, Contact, legal pages)

**Files:**
- Create: `lib/pages.ts`
- Create: `content/pages/about.mdx`
- Create: `content/pages/editorial-standards.mdx`
- Create: `content/pages/privacy.mdx`
- Create: `content/pages/terms.mdx`
- Create: `content/pages/affiliate-disclosure.mdx`
- Test: `lib/pages.test.ts`

**Interfaces:**
- Consumes: nothing (reads filesystem directly)
- Produces:
  - `interface StaticPage { slug: string; title: string; content: string }`
  - `getPageBySlug(slug: string): StaticPage | null`

- [ ] **Step 1: Create the page content files**

`content/pages/about.mdx`:
```mdx
---
title: "About Mavora"
---

Mavora helps ambitious students, professionals, creators and founders understand technology, AI, productivity and business in a practical, actionable way.
```

`content/pages/editorial-standards.mdx`:
```mdx
---
title: "Editorial Standards"
---

Every article is fact-checked before publishing. AI tools may assist with research and drafting, but a human reviews and edits every piece before it goes live. Corrections are made within 48 hours of being reported, with a visible note on the article.
```

`content/pages/privacy.mdx`:
```mdx
---
title: "Privacy Policy"
---

This site uses Google Analytics to understand traffic. We collect email addresses only when you voluntarily subscribe to our newsletter via Buttondown. We do not sell your data.
```

`content/pages/terms.mdx`:
```mdx
---
title: "Terms of Use"
---

By using this site you agree to use its content for personal, non-commercial purposes unless otherwise stated. Content is provided as-is without warranty.
```

`content/pages/affiliate-disclosure.mdx`:
```mdx
---
title: "Affiliate Disclosure"
---

Some links on this site are affiliate links. If you purchase through them, Mavora may earn a commission at no extra cost to you. We only recommend tools and products we've evaluated.
```

- [ ] **Step 2: Write the failing test**

`lib/pages.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getPageBySlug } from './pages'

describe('static page loader', () => {
  it('loads a page by slug', () => {
    const page = getPageBySlug('about')
    expect(page).not.toBeNull()
    expect(page?.title).toBe('About Mavora')
  })

  it('returns null for a missing page', () => {
    expect(getPageBySlug('does-not-exist')).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './pages'"

- [ ] **Step 4: Implement the loader**

`lib/pages.ts`:
```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (2 tests in `lib/pages.test.ts`, plus all earlier tests)

- [ ] **Step 6: Commit**

```bash
git add lib/pages.ts lib/pages.test.ts content/pages/
git commit -m "feat: add static page schema and loader, seed legal/about content"
```

---

### Task 4: Routing & Rendering

**Files:**
- Modify: `app/page.tsx`
- Create: `app/[pillar]/page.tsx`
- Create: `app/[pillar]/[slug]/page.tsx`
- Create: `app/about/page.tsx`
- Create: `app/editorial-standards/page.tsx`
- Create: `app/privacy/page.tsx`
- Create: `app/terms/page.tsx`
- Create: `app/affiliate-disclosure/page.tsx`

**Interfaces:**
- Consumes: `getAllPosts`, `getPostsByPillar`, `getPostBySlug`, `PILLARS`, `Pillar` from `lib/content.ts` (Task 2); `getPageBySlug` from `lib/pages.ts` (Task 3)
- Produces: full static route tree required by static export (`generateStaticParams` on every dynamic route)

- [ ] **Step 1: Homepage lists latest posts**

`app/page.tsx`:
```tsx
import Link from 'next/link'
import { getAllPosts } from '@/lib/content'

export default function HomePage() {
  const posts = getAllPosts()
  return (
    <main>
      <h1>Mavora</h1>
      <ul>
        {posts.map((post) => (
          <li key={`${post.pillar}-${post.slug}`}>
            <Link href={`/${post.pillar}/${post.slug}`}>{post.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Category page**

`app/[pillar]/page.tsx`:
```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PILLARS, Pillar, getPostsByPillar } from '@/lib/content'

export function generateStaticParams() {
  return PILLARS.map((pillar) => ({ pillar }))
}

export default function PillarPage({ params }: { params: { pillar: string } }) {
  if (!PILLARS.includes(params.pillar as Pillar)) notFound()
  const pillar = params.pillar as Pillar
  const posts = getPostsByPillar(pillar)
  return (
    <main>
      <h1>{pillar}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/${pillar}/${post.slug}`}>{post.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 3: Article page**

`app/[pillar]/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { PILLARS, Pillar, getAllPosts, getPostBySlug } from '@/lib/content'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ pillar: post.pillar, slug: post.slug }))
}

export default function ArticlePage({ params }: { params: { pillar: string; slug: string } }) {
  if (!PILLARS.includes(params.pillar as Pillar)) notFound()
  const post = getPostBySlug(params.pillar as Pillar, params.slug)
  if (!post) notFound()
  return (
    <article>
      <h1>{post.frontmatter.title}</h1>
      <p>{post.frontmatter.description}</p>
      <div>{post.content}</div>
    </article>
  )
}
```

- [ ] **Step 4: Static pages (About, Editorial Standards, Privacy, Terms, Affiliate Disclosure)**

`app/about/page.tsx` (repeat this exact pattern for the other four routes, swapping the slug):
```tsx
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/pages'

export default function AboutPage() {
  const page = getPageBySlug('about')
  if (!page) notFound()
  return (
    <main>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
    </main>
  )
}
```

`app/editorial-standards/page.tsx` — identical to above with `getPageBySlug('editorial-standards')`.
`app/privacy/page.tsx` — identical with `getPageBySlug('privacy')`.
`app/terms/page.tsx` — identical with `getPageBySlug('terms')`.
`app/affiliate-disclosure/page.tsx` — identical with `getPageBySlug('affiliate-disclosure')`.

- [ ] **Step 5: Build and manually verify routes**

Run: `npm run build && npx serve out`
Expected: `out/index.html`, `out/ai/index.html`, `out/ai/example-post/index.html`, `out/about/index.html`, `out/privacy/index.html` all exist and render without errors.

- [ ] **Step 6: Commit**

```bash
git add app/
git commit -m "feat: add homepage, category, article, and static page routes"
```

---

### Task 5: SEO Plumbing (sitemap, robots, RSS)

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `app/feed.xml/route.ts`
- Test: `app/sitemap.test.ts`

**Interfaces:**
- Consumes: `getAllPosts` from `lib/content.ts` (Task 2)
- Produces: `SITE_URL` constant (used by sitemap, robots, and feed — define once, reuse)

- [ ] **Step 1: Define the site URL constant**

`lib/site.ts`:
```ts
export const SITE_URL = 'https://mavora.example.com'
```

- [ ] **Step 2: Write the failing test for sitemap coverage**

`app/sitemap.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'
import { getAllPosts } from '@/lib/content'

describe('sitemap', () => {
  it('includes every non-draft post', () => {
    const entries = sitemap()
    const posts = getAllPosts()
    for (const post of posts) {
      const url = `https://mavora.example.com/${post.pillar}/${post.slug}`
      expect(entries.some((e) => e.url === url)).toBe(true)
    }
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './sitemap'"

- [ ] **Step 4: Implement sitemap**

`app/sitemap.ts`:
```ts
import { MetadataRoute } from 'next'
import { getAllPosts, PILLARS } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const postEntries = posts.map((post) => ({
    url: `${SITE_URL}/${post.pillar}/${post.slug}`,
    lastModified: post.frontmatter.publishedAt,
  }))
  const pillarEntries = PILLARS.map((pillar) => ({
    url: `${SITE_URL}/${pillar}`,
  }))
  return [{ url: SITE_URL }, ...pillarEntries, ...postEntries]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Implement robots.txt**

`app/robots.ts`:
```ts
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

- [ ] **Step 7: Implement RSS feed**

`app/feed.xml/route.ts`:
```ts
import { getAllPosts } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts()
  const items = posts
    .map(
      (post) => `
    <item>
      <title>${post.frontmatter.title}</title>
      <link>${SITE_URL}/${post.pillar}/${post.slug}</link>
      <description>${post.frontmatter.description}</description>
      <pubDate>${new Date(post.frontmatter.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Mavora</title>
  <link>${SITE_URL}</link>
  <description>Technology, AI, productivity and business, explained practically.</description>
  ${items}
</channel></rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
```

- [ ] **Step 8: Build and verify SEO files exist**

Run: `npm run build`
Expected: `out/sitemap.xml`, `out/robots.txt`, `out/feed.xml/index.html` (or `out/feed.xml`) all exist.

- [ ] **Step 9: Commit**

```bash
git add lib/site.ts app/sitemap.ts app/sitemap.test.ts app/robots.ts app/feed.xml/
git commit -m "feat: add sitemap, robots.txt, and RSS feed"
```

---

### Task 6: Contact Form (Formspree — no custom backend)

**Files:**
- Create: `components/ContactForm.tsx`
- Modify: `app/contact/page.tsx` (create if not already present)
- Create: `.env.example`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_FORMSPREE_ID` env var
- Produces: `<ContactForm />` component, reusable if a second contact surface is ever added

- [ ] **Step 1: Sign up for Formspree (manual, one-time)**

Go to formspree.io, create a free account, create a form, copy the form ID (format: `xxxxxxxx`). This step has no code — it's an account setup step, not testable.

- [ ] **Step 2: Add the env var**

`.env.example`:
```
NEXT_PUBLIC_FORMSPREE_ID=your_formspree_form_id
```

Create `.env.local` (not committed) with the real ID copied from Step 1.

- [ ] **Step 3: Build the contact form component**

`components/ContactForm.tsx`:
```tsx
'use client'

export function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_ID
  return (
    <form action={`https://formspree.io/f/${formId}`} method="POST">
      <label htmlFor="email">Email</label>
      <input id="email" type="email" name="email" required />

      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" required />

      {/* honeypot field to reduce spam — real users leave it empty */}
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button type="submit">Send</button>
    </form>
  )
}
```

- [ ] **Step 4: Wire it into the contact page**

`app/contact/page.tsx`:
```tsx
import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main>
      <h1>Contact</h1>
      <ContactForm />
    </main>
  )
}
```

- [ ] **Step 5: Manually verify submission**

Run: `npm run build && npx serve out`, open `/contact`, submit the form with a test message.
Expected: Formspree dashboard shows the submission and/or you receive the notification email.

- [ ] **Step 6: Commit**

```bash
git add components/ContactForm.tsx app/contact/page.tsx .env.example
git commit -m "feat: add contact form via Formspree, no custom backend"
```

---

### Task 7: Newsletter Signup (Buttondown — no custom backend)

**Files:**
- Create: `components/NewsletterSignup.tsx`
- Modify: `app/layout.tsx` (mount signup in a footer)
- Modify: `.env.example`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_BUTTONDOWN_USERNAME` env var
- Produces: `<NewsletterSignup />` component, mounted site-wide via layout footer

- [ ] **Step 1: Sign up for Buttondown (manual, one-time)**

Go to buttondown.com, create a free account, note your username (used in the form action URL). No code — account setup step.

- [ ] **Step 2: Add the env var**

Append to `.env.example`:
```
NEXT_PUBLIC_BUTTONDOWN_USERNAME=your_buttondown_username
```

- [ ] **Step 3: Build the signup component**

`components/NewsletterSignup.tsx`:
```tsx
'use client'

export function NewsletterSignup() {
  const username = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME
  return (
    <form action={`https://buttondown.com/api/emails/embed-subscribe/${username}`} method="POST" target="popupwindow">
      <label htmlFor="bd-email">Subscribe to the newsletter</label>
      <input id="bd-email" type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  )
}
```

- [ ] **Step 4: Mount it site-wide in the footer**

`app/layout.tsx` — add the import and render `<NewsletterSignup />` inside a `<footer>` element alongside existing layout content.

- [ ] **Step 5: Manually verify subscription**

Run: `npm run build && npx serve out`, submit the form with a test email.
Expected: Buttondown dashboard shows the new subscriber.

- [ ] **Step 6: Commit**

```bash
git add components/NewsletterSignup.tsx app/layout.tsx .env.example
git commit -m "feat: add newsletter signup via Buttondown, no custom backend"
```

---

### Task 8: Deployment to Cloudflare Pages

**Files:**
- Create: `.gitignore` entries for `out/`, `.env.local`, `node_modules/`
- No application code — this task is deployment configuration only

**Interfaces:**
- Consumes: `npm run build` output (`out/` directory) from all prior tasks

- [ ] **Step 1: Ensure `.gitignore` excludes build output and secrets**

`.gitignore` must include:
```
node_modules/
out/
.env.local
```

- [ ] **Step 2: Push the repo to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 3: Connect Cloudflare Pages (manual, one-time, via dashboard)**

In the Cloudflare dashboard: Pages → Create a project → Connect to Git → select the repo.
- Build command: `npm run build`
- Build output directory: `out`
- Environment variables: add `NEXT_PUBLIC_FORMSPREE_ID` and `NEXT_PUBLIC_BUTTONDOWN_USERNAME` with the real values from Tasks 6–7

- [ ] **Step 4: Deploy and verify**

Trigger the first deploy from the dashboard (or push a commit — Cloudflare Pages auto-deploys on push to `main`).
Expected: Cloudflare-provided `*.pages.dev` URL loads the homepage, `/ai`, `/ai/example-post`, `/about`, `/contact`, `/sitemap.xml`, `/robots.txt`, `/feed.xml` all resolve correctly.

- [ ] **Step 5: Confirm the publish flow end-to-end**

Add a second real `.mdx` post under `content/posts/<pillar>/`, commit, push.
Expected: Cloudflare Pages auto-builds and the new post appears live within a few minutes, with no manual deploy step. This is the full "publish" flow going forward: write MDX → git push → live.
