# Mavora Public Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the already-working public site (homepage, category pages, article pages, static pages) with a modern, animated, light/dark design matching the reference layout, and add a client-side search page.

**Architecture:** Tailwind CSS for styling (CSS-variable-driven theme tokens, `dark:` class strategy), GSAP + ScrollTrigger for scroll-driven entrance animations, a shared `ArticleCard` component reused across every listing surface, and a build-time-generated static search index (no backend, static-export compatible).

**Tech Stack:** Tailwind CSS · `@tailwindcss/typography` · GSAP (`gsap`, `gsap/ScrollTrigger`) · `next/font/google` (Inter) · Next.js App Router (existing, static export, unchanged).

## Global Constraints

- Zero changes to `lib/content.ts`, the content schema, `content/posts/**`, or any route's data-fetching logic — this is a presentation-layer pass over already-working, already-tested pages.
- Static export (`output: 'export'` in `next.config.js`) must keep working — no server-only APIs, no dynamic route segments without `generateStaticParams`.
- Accent color: `#DC2626`. Light theme bg `#FFFFFF`/text `#171717`. Dark theme bg `#0A0A0A`/text `#EDEDED`. Exact values from the spec, don't approximate.
- Content pillars (fixed enum, already defined in `lib/content.ts`): `ai`, `technology`, `productivity`, `business`.
- Every GSAP animation must check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip straight to the end state when true — not optional.
- Tailwind's CSS-first v4 configuration (`@import "tailwindcss"` + `@theme` blocks in CSS, not a `tailwind.config.js` file) is assumed by this plan based on Tailwind's current major version — **verify the actually-installed Tailwind version's real configuration API before writing config**, the same discipline this project has applied to every other fast-moving dependency (Next.js, Clerk, BlockNote, Cloudflare tooling all drifted from what a plan assumed at write-time in past work on this project). Adapt and report if it's drifted.
- `npm run build` must succeed after every task — this is the project's established regression gate for presentation-layer work with no automated test coverage of its own.

---

## File Structure

```
app/
  layout.tsx                    # modify: font, theme-init script, Header/Footer
  globals.css                   # modify: Tailwind import, @theme tokens, typography base
  page.tsx                      # modify: homepage redesign
  [pillar]/page.tsx             # modify: category page redesign
  [pillar]/[slug]/page.tsx      # modify: article page redesign
  about/page.tsx                # modify: static page styling
  contact/page.tsx              # modify: static page styling
  privacy/page.tsx              # modify: static page styling
  terms/page.tsx                # modify: static page styling
  affiliate-disclosure/page.tsx # modify: static page styling
  editorial-standards/page.tsx  # modify: static page styling
  search/page.tsx               # create: search page
  search-index.json/route.ts    # create: static search index endpoint
components/
  Header.tsx                    # create
  Footer.tsx                    # create
  ThemeToggle.tsx                # create
  ArticleCard.tsx                 # create
  CategoryList.tsx                 # create
  SearchBox.tsx                     # create
  ContactForm.tsx                    # modify: restyle only, logic unchanged
  NewsletterSignup.tsx                 # modify: restyle only, logic unchanged
lib/
  search-index.ts                       # create: getSearchIndex() -> SearchEntry[]
  search-index.test.ts                   # create
  gsap-reveal.ts                          # create: revealOnScroll() helper + reduced-motion check
```

---

### Task 1: Tailwind + Design Tokens

**Files:**
- Modify: `package.json` (add Tailwind deps)
- Create: `postcss.config.mjs`
- Modify: `app/globals.css`
- Test: manual build check (no automated test — pure config/CSS)

**Interfaces:**
- Produces: CSS custom properties `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-border`, `--color-accent` (defined for `:root` and `:root.dark`), and Tailwind utility classes available to every later task (`bg-[var(--color-bg)]` etc., or Tailwind v4's `@theme`-mapped equivalents — resolve this exactly once you've verified the installed version's API, and use that same mapping consistently in every later task).

- [ ] **Step 1: Install Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography
```

Read `node_modules/tailwindcss/package.json`'s `version` field and check `node_modules/tailwindcss/README.md`/the package's own docs for the current configuration approach (CSS-first `@theme` vs a `tailwind.config.js` file) before proceeding — the steps below assume CSS-first v4 config; adapt if the installed version differs.

- [ ] **Step 2: Configure PostCSS**

`postcss.config.mjs`:
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

- [ ] **Step 3: Replace `app/globals.css` with the Tailwind import and design tokens**

`app/globals.css`:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-accent: #dc2626;
}

:root {
  --color-bg: #ffffff;
  --color-fg: #171717;
  --color-fg-muted: #525252;
  --color-border: #e5e5e5;
}

:root.dark {
  --color-bg: #0a0a0a;
  --color-fg: #ededed;
  --color-fg-muted: #a3a3a3;
  --color-border: #262626;
}

html {
  height: 100%;
}

body {
  min-height: 100%;
  background-color: var(--color-bg);
  color: var(--color-fg);
  transition: background-color 0.2s ease, color 0.2s ease;
}

* {
  box-sizing: border-box;
}
```

If the installed Tailwind version's `@plugin` directive syntax differs (v4 introduced this for registering plugins from CSS), adapt to whatever the verified-current syntax is; the goal is `@tailwindcss/typography`'s `prose` classes being available.

- [ ] **Step 4: Verify the build still succeeds**

Run: `npm run build`
Expected: succeeds, no CSS/PostCSS errors. Pages will look unstyled-but-not-broken at this point — later tasks apply the actual layout.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json postcss.config.mjs app/globals.css
git commit -m "chore: add Tailwind CSS and design tokens"
```

---

### Task 2: Theme Toggle

**Files:**
- Create: `components/ThemeToggle.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `<ThemeToggle />` — client component, no props, manages its own state via `localStorage` + a `dark` class on `<html>`. Consumed by Task 3's `Header`.

- [ ] **Step 1: Add a pre-paint theme-init script to the root layout**

Modify `app/layout.tsx` — add this inline script as the first child of `<head>` (or immediately inside `<html>` before `<body>`, whichever the current file's structure makes cleanest — read the current file first), to avoid a flash of the wrong theme on load:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function () {
        var stored = localStorage.getItem('theme');
        var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'dark') document.documentElement.classList.add('dark');
      })();
    `,
  }}
/>
```

- [ ] **Step 2: Build the toggle component**

`components/ThemeToggle.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="rounded-full p-2 text-[var(--color-fg)] hover:bg-[var(--color-border)] transition-colors"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/ThemeToggle.tsx
git commit -m "feat: add light/dark theme toggle with pre-paint flash prevention"
```

---

### Task 3: Header Component

**Files:**
- Create: `components/Header.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `PILLARS` from `lib/content.ts`, `<ThemeToggle />` (Task 2)
- Produces: `<Header />` — no props, renders on every page via `layout.tsx`

- [ ] **Step 1: Build the header**

`components/Header.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PILLARS } from '@/lib/content'
import { ThemeToggle } from './ThemeToggle'

const PILLAR_LABELS: Record<(typeof PILLARS)[number], string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)] z-50">
      <div className="mx-auto max-w-[1280px] px-6 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-extrabold tracking-wide text-xl text-[var(--color-accent)]">
          MAVORA
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link key={pillar} href={`/${pillar}`} className="hover:text-[var(--color-accent)] transition-colors">
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="Search" className="rounded-full p-2 hover:bg-[var(--color-border)] transition-colors">
            🔍
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="md:hidden rounded-full p-2 hover:bg-[var(--color-border)] transition-colors"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-[var(--color-border)] px-6 py-4 flex flex-col gap-3">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          {PILLARS.map((pillar) => (
            <Link key={pillar} href={`/${pillar}`} onClick={() => setMobileOpen(false)}>
              {PILLAR_LABELS[pillar]}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Mount it in the root layout**

Modify `app/layout.tsx` — import `Header` and render it as the first child inside `<body>`, before `{children}`.

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds, header renders on every route in the output.

- [ ] **Step 4: Commit**

```bash
git add components/Header.tsx app/layout.tsx
git commit -m "feat: add site header with nav, search link, theme toggle, mobile menu"
```

---

### Task 4: Footer Component

**Files:**
- Create: `components/Footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: existing `<NewsletterSignup />` (unchanged logic, from the original build)
- Produces: `<Footer />` — no props

- [ ] **Step 1: Build the footer**

`components/Footer.tsx`:
```tsx
import Link from 'next/link'
import { NewsletterSignup } from './NewsletterSignup'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-16">
      <div className="mx-auto max-w-[1280px] px-6 md:px-8 py-12 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="font-extrabold tracking-wide text-[var(--color-accent)] mb-3">MAVORA</p>
          <nav className="flex flex-col gap-2 text-sm text-[var(--color-fg-muted)]">
            <Link href="/about" className="hover:text-[var(--color-accent)]">About</Link>
            <Link href="/contact" className="hover:text-[var(--color-accent)]">Contact</Link>
            <Link href="/editorial-standards" className="hover:text-[var(--color-accent)]">Editorial Standards</Link>
            <Link href="/privacy" className="hover:text-[var(--color-accent)]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--color-accent)]">Terms of Use</Link>
            <Link href="/affiliate-disclosure" className="hover:text-[var(--color-accent)]">Affiliate Disclosure</Link>
          </nav>
        </div>

        <div className="max-w-sm">
          <NewsletterSignup />
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-6 md:px-8 py-4 text-xs text-[var(--color-fg-muted)]">
        © {new Date().getFullYear()} Mavora. All rights reserved.
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Mount it in the root layout**

Modify `app/layout.tsx` — render `<Footer />` as the last child inside `<body>`, after `{children}`.

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds. Check `out/index.html` (or equivalent) contains the footer's link list and the newsletter form.

- [ ] **Step 4: Commit**

```bash
git add components/Footer.tsx app/layout.tsx
git commit -m "feat: add site footer with link list and newsletter signup"
```

---

### Task 5: ArticleCard Component

**Files:**
- Create: `components/ArticleCard.tsx`

**Interfaces:**
- Consumes: `Post` type from `lib/content.ts` (`{ slug, pillar, frontmatter: { title, description, publishedAt, ogImage }, ... }`)
- Produces: `<ArticleCard post={Post} variant="hero" | "grid" | "compact" />` — consumed by Tasks 7, 8, 12

- [ ] **Step 1: Build the card**

`components/ArticleCard.tsx`:
```tsx
import Link from 'next/link'
import type { Post } from '@/lib/content'

interface ArticleCardProps {
  post: Post
  variant: 'hero' | 'grid' | 'compact'
}

const PILLAR_LABELS: Record<Post['pillar'], string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

export function ArticleCard({ post, variant }: ArticleCardProps) {
  const href = `/${post.pillar}/${post.slug}`
  const image = post.frontmatter.ogImage

  if (variant === 'compact') {
    return (
      <Link href={href} className="flex gap-3 group">
        {image && (
          <img
            src={image}
            alt=""
            className="w-16 h-16 object-cover rounded shrink-0 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <div>
          <p className="text-sm font-semibold group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {post.frontmatter.title}
          </p>
          <p className="text-xs text-[var(--color-fg-muted)] mt-1">{post.frontmatter.publishedAt}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'hero') {
    return (
      <Link href={href} className="group block">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] mb-2">
          {PILLAR_LABELS[post.pillar]}
        </p>
        {image && (
          <img
            src={image}
            alt=""
            className="w-full aspect-[16/9] object-cover rounded-lg mb-4 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight group-hover:text-[var(--color-accent)] transition-colors">
          {post.frontmatter.title}
        </h2>
        <p className="text-[var(--color-fg-muted)] mt-2">{post.frontmatter.description}</p>
        <p className="text-sm text-[var(--color-fg-muted)] mt-3">{post.frontmatter.publishedAt}</p>
      </Link>
    )
  }

  return (
    <Link href={href} className="group block">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] mb-2">
        {PILLAR_LABELS[post.pillar]}
      </p>
      {image && (
        <img
          src={image}
          alt=""
          className="w-full aspect-[16/9] object-cover rounded-lg mb-3 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      <h3 className="font-bold leading-snug group-hover:text-[var(--color-accent)] transition-colors">
        {post.frontmatter.title}
      </h3>
      <p className="text-sm text-[var(--color-fg-muted)] mt-2">{post.frontmatter.publishedAt}</p>
    </Link>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds (this component isn't wired into any page yet — this step just confirms it compiles cleanly).

- [ ] **Step 3: Commit**

```bash
git add components/ArticleCard.tsx
git commit -m "feat: add ArticleCard component with hero/grid/compact variants"
```

---

### Task 6: CategoryList Component

**Files:**
- Create: `components/CategoryList.tsx`

**Interfaces:**
- Consumes: `PILLARS`, `getPostsByPillar` from `lib/content.ts`
- Produces: `<CategoryList />` — server component (reads post counts directly, no props needed), consumed by Task 7's homepage sidebar

- [ ] **Step 1: Build the component**

`components/CategoryList.tsx`:
```tsx
import Link from 'next/link'
import { PILLARS, getPostsByPillar } from '@/lib/content'

const PILLAR_LABELS: Record<(typeof PILLARS)[number], string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

export function CategoryList() {
  const counts = PILLARS.map((pillar) => ({
    pillar,
    label: PILLAR_LABELS[pillar],
    count: getPostsByPillar(pillar).length,
  }))

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-3">Categories</h3>
      <ul className="flex flex-col gap-2">
        {counts.map(({ pillar, label, count }) => (
          <li key={pillar} className="flex justify-between items-center">
            <Link href={`/${pillar}`} className="hover:text-[var(--color-accent)] transition-colors">
              {label}
            </Link>
            <span className="text-sm text-[var(--color-fg-muted)]">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/CategoryList.tsx
git commit -m "feat: add CategoryList sidebar component with live post counts"
```

---

### Task 7: Homepage Redesign

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getAllPosts` (`lib/content.ts`), `<ArticleCard>` (Task 5), `<CategoryList>` (Task 6)

- [ ] **Step 1: Rebuild the homepage**

Replace the contents of `app/page.tsx` with:
```tsx
import { getAllPosts } from '@/lib/content'
import { ArticleCard } from '@/components/ArticleCard'
import { CategoryList } from '@/components/CategoryList'

export default function HomePage() {
  const posts = getAllPosts()
  const [hero, ...rest] = posts
  const latestNews = rest.slice(0, 4)
  const featured = rest.slice(4, 7)
  const latestArticles = rest.slice(7)

  return (
    <main className="mx-auto max-w-[1280px] px-6 md:px-8 py-10">
      {hero && (
        <section className="grid md:grid-cols-3 gap-10 mb-16">
          <div className="md:col-span-2">
            <ArticleCard post={hero} variant="hero" />
          </div>
          <aside className="flex flex-col gap-8">
            {latestNews.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-3">
                  Latest News
                </h3>
                <div className="flex flex-col gap-4">
                  {latestNews.map((post) => (
                    <ArticleCard key={`${post.pillar}-${post.slug}`} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            )}
            <CategoryList />
          </aside>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-6">Featured</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featured.map((post) => (
              <ArticleCard key={`${post.pillar}-${post.slug}`} post={post} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {latestArticles.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-6">
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {latestArticles.map((post) => (
              <ArticleCard key={`${post.pillar}-${post.slug}`} post={post} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Verify the build succeeds and the homepage has real content**

Run: `npm run build && npx serve out`
Expected: build succeeds; `out/index.html` contains the hero post's title, the sidebar's category list, and (if more than one post exists in `content/posts/`) featured/latest sections. With only the single `content/posts/ai/example-post.mdx` fixture from the original build, `rest`/`featured`/`latestArticles` will be empty arrays and those sections simply won't render — expected, not a bug, given there's only one real post in the repo right now.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign homepage with hero, sidebar, featured and latest sections"
```

---

### Task 8: Category Page Redesign

**Files:**
- Modify: `app/[pillar]/page.tsx`

**Interfaces:**
- Consumes: `getPostsByPillar`, `PILLARS`, `Pillar` (`lib/content.ts`), `<ArticleCard>` (Task 5)

- [ ] **Step 1: Rebuild the category page**

Replace the contents of `app/[pillar]/page.tsx`, keeping the existing `generateStaticParams`/`notFound()` logic exactly as-is (read the current file first — do not change the async/`params` handling that Task 4 of the original build already adapted for the installed Next.js version), and only change the rendered JSX to:

```tsx
import { ArticleCard } from '@/components/ArticleCard'

const PILLAR_LABELS: Record<string, string> = {
  ai: 'AI',
  technology: 'Technology',
  productivity: 'Productivity',
  business: 'Business',
}

// ... inside the page component, after the existing notFound()/posts-fetching logic:
return (
  <main className="mx-auto max-w-[1280px] px-6 md:px-8 py-10">
    <h1 className="text-3xl font-extrabold mb-8">{PILLAR_LABELS[pillar] ?? pillar}</h1>
    <div className="grid md:grid-cols-3 gap-8">
      {posts.map((post) => (
        <ArticleCard key={post.slug} post={post} variant="grid" />
      ))}
    </div>
  </main>
)
```

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds; `out/ai/index.html` (and the other 3 pillars) render the pillar title and grid.

- [ ] **Step 3: Commit**

```bash
git add app/[pillar]/page.tsx
git commit -m "feat: redesign category pages with ArticleCard grid"
```

---

### Task 9: Article Page Redesign

**Files:**
- Modify: `app/[pillar]/[slug]/page.tsx`

**Interfaces:**
- Consumes: existing `getPostBySlug`/`generateStaticParams` logic (unchanged), `<MDXRemote>` (already wired from the original build's Task 12 fix — must not be removed)

- [ ] **Step 1: Restyle the article page**

Modify `app/[pillar]/[slug]/page.tsx` — keep all existing data-fetching, `notFound()`, and `<MDXRemote source={post.content} />` logic exactly as-is (this is the piece the original build's final review specifically fixed to make markdown actually compile — do not touch that wiring). Change only the surrounding JSX to:

```tsx
return (
  <main>
    {post.frontmatter.ogImage && (
      <img
        src={post.frontmatter.ogImage}
        alt=""
        className="w-full aspect-[21/9] object-cover"
      />
    )}
    <article className="mx-auto max-w-[720px] px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] mb-2">
        {post.pillar}
      </p>
      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">{post.frontmatter.title}</h1>
      <p className="text-sm text-[var(--color-fg-muted)] mb-8">{post.frontmatter.publishedAt}</p>
      <div className="prose dark:prose-invert max-w-none prose-a:text-[var(--color-accent)]">
        <MDXRemote source={post.content} />
      </div>
    </article>
  </main>
)
```

- [ ] **Step 2: Verify the build succeeds and MDX still renders correctly**

Run: `npm run build`
Expected: succeeds; `out/ai/example-post/index.html` contains real `<h2>`/`<strong>`/`<a>` tags from the compiled MDX (per the original build's own regression check), now wrapped in the `prose` typography classes.

- [ ] **Step 3: Commit**

```bash
git add app/[pillar]/[slug]/page.tsx
git commit -m "feat: redesign article page with reading-column layout and MDX typography"
```

---

### Task 10: Static Pages Styling

**Files:**
- Modify: `app/about/page.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `app/privacy/page.tsx`
- Modify: `app/terms/page.tsx`
- Modify: `app/affiliate-disclosure/page.tsx`
- Modify: `app/editorial-standards/page.tsx`
- Modify: `components/ContactForm.tsx`

**Interfaces:**
- Consumes: existing `getPageBySlug` logic (unchanged) on each of the 6 pages

- [ ] **Step 1: Apply a consistent typography wrapper to all 6 static pages**

For each of the 6 files above, keep the existing `getPageBySlug`/`notFound()` logic unchanged, and wrap the rendered content in the same reading-column pattern (read each current file first to preserve its exact data-fetching):

```tsx
return (
  <main className="mx-auto max-w-[720px] px-6 py-10">
    <h1 className="text-3xl font-extrabold mb-6">{page.title}</h1>
    <div className="prose dark:prose-invert max-w-none">{page.content}</div>
  </main>
)
```

- [ ] **Step 2: Restyle the contact form**

Modify `components/ContactForm.tsx` — keep the existing Formspree `action`, field names, and honeypot field exactly as-is (this is the piece the original build wired to a real third-party endpoint — do not change any `name` attribute or the form's `action`/`method`). Only change the JSX structure/className values to:

```tsx
<form action={`https://formspree.io/f/${formId}`} method="POST" className="flex flex-col gap-4 max-w-md">
  <div>
    <label htmlFor="email" className="block text-sm font-semibold mb-1">Email</label>
    <input
      id="email"
      type="email"
      name="email"
      required
      className="w-full rounded border border-[var(--color-border)] bg-transparent px-3 py-2"
    />
  </div>
  <div>
    <label htmlFor="message" className="block text-sm font-semibold mb-1">Message</label>
    <textarea
      id="message"
      name="message"
      required
      rows={5}
      className="w-full rounded border border-[var(--color-border)] bg-transparent px-3 py-2"
    />
  </div>
  <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
  <button
    type="submit"
    className="self-start rounded bg-[var(--color-accent)] text-white px-5 py-2 font-semibold hover:opacity-90 transition-opacity"
  >
    Send
  </button>
</form>
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds; all 6 static pages and `/contact` render with the new layout, Formspree form fields unchanged.

- [ ] **Step 4: Commit**

```bash
git add app/about/page.tsx app/contact/page.tsx app/privacy/page.tsx app/terms/page.tsx app/affiliate-disclosure/page.tsx app/editorial-standards/page.tsx components/ContactForm.tsx
git commit -m "feat: apply consistent typography styling to static pages and contact form"
```

---

### Task 11: Search Index Generation

**Files:**
- Create: `lib/search-index.ts`
- Create: `lib/search-index.test.ts`
- Create: `app/search-index.json/route.ts`

**Interfaces:**
- Produces:
  - `interface SearchEntry { title: string; description: string; pillar: string; slug: string; publishedAt: string }`
  - `getSearchIndex(): SearchEntry[]`
  - `GET /search-index.json` — static route, served as a plain JSON array

- [ ] **Step 1: Write the failing test**

`lib/search-index.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getSearchIndex } from './search-index'

describe('getSearchIndex', () => {
  it('returns an entry for every non-draft post with the expected shape', () => {
    const index = getSearchIndex()
    expect(index.length).toBeGreaterThan(0)
    const entry = index[0]
    expect(entry).toHaveProperty('title')
    expect(entry).toHaveProperty('description')
    expect(entry).toHaveProperty('pillar')
    expect(entry).toHaveProperty('slug')
    expect(entry).toHaveProperty('publishedAt')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './search-index'"

- [ ] **Step 3: Implement the index builder**

`lib/search-index.ts`:
```ts
import { getAllPosts } from './content'

export interface SearchEntry {
  title: string
  description: string
  pillar: string
  slug: string
  publishedAt: string
}

export function getSearchIndex(): SearchEntry[] {
  return getAllPosts().map((post) => ({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    pillar: post.pillar,
    slug: post.slug,
    publishedAt: post.frontmatter.publishedAt,
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Expose it as a static JSON route**

`app/search-index.json/route.ts`:
```ts
import { getSearchIndex } from '@/lib/search-index'

export const dynamic = 'force-static'

export function GET() {
  return new Response(JSON.stringify(getSearchIndex()), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 6: Verify the build produces the static JSON file**

Run: `npm run build`
Expected: succeeds; `out/search-index.json` (or `out/search-index.json/index.json` depending on the export layout — check what actually gets produced, matching the pattern already established by `feed.xml` in the original build) contains a JSON array with the fixture post's data.

- [ ] **Step 7: Commit**

```bash
git add lib/search-index.ts lib/search-index.test.ts app/search-index.json/
git commit -m "feat: add build-time search index generation"
```

---

### Task 12: Search Page

**Files:**
- Create: `components/SearchBox.tsx`
- Create: `app/search/page.tsx`

**Interfaces:**
- Consumes: `GET /search-index.json` (Task 11), `<ArticleCard>` (Task 5, `compact` variant) — note `ArticleCard` expects a `Post`-shaped object; since the search index is a lighter `SearchEntry`, either adapt `ArticleCard` to accept the subset of fields it actually uses, or render search results with inline markup matching the `compact` variant's look. Resolve this by checking exactly which `Post` fields `ArticleCard`'s `compact` branch reads (per Task 5's code: `post.pillar`, `post.slug`, `post.frontmatter.title`, `post.frontmatter.publishedAt`, `post.frontmatter.ogImage`) and construct a minimal compatible shape from `SearchEntry` (which has no `ogImage` — the compact card already handles a missing image gracefully via its `image &&` guard, so this is safe).

- [ ] **Step 1: Build the search box + results**

`components/SearchBox.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SearchEntry } from '@/lib/search-index'

export function SearchBox() {
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setIndex)
  }, [])

  const results = query.trim()
    ? index.filter((entry) => {
        const haystack = `${entry.title} ${entry.description}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : index

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="w-full rounded border border-[var(--color-border)] bg-transparent px-4 py-3 text-lg mb-8"
        autoFocus
      />
      <ul className="flex flex-col gap-4">
        {results.map((entry) => (
          <li key={`${entry.pillar}-${entry.slug}`}>
            <Link href={`/${entry.pillar}/${entry.slug}`} className="group block">
              <p className="font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                {entry.title}
              </p>
              <p className="text-sm text-[var(--color-fg-muted)]">{entry.description}</p>
            </Link>
          </li>
        ))}
        {query.trim() && results.length === 0 && (
          <p className="text-[var(--color-fg-muted)]">No results for &quot;{query}&quot;.</p>
        )}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Build the search page**

`app/search/page.tsx`:
```tsx
import { SearchBox } from '@/components/SearchBox'

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-8">Search</h1>
      <SearchBox />
    </main>
  )
}
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds; `out/search/index.html` exists.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all tests (including Task 11's) still pass.

- [ ] **Step 5: Commit**

```bash
git add components/SearchBox.tsx app/search/
git commit -m "feat: add client-side search page"
```

---

### Task 13: GSAP Scroll-Reveal Utility

**Files:**
- Create: `lib/gsap-reveal.ts`
- Create: `lib/gsap-reveal.test.ts`

**Interfaces:**
- Produces: `prefersReducedMotion(): boolean` and `revealOnScroll(element: HTMLElement, options?: { delay?: number }): void` — consumed by Task 14

- [ ] **Step 1: Install GSAP**

```bash
npm install gsap
```

Verify `gsap/ScrollTrigger`'s current registration API (`gsap.registerPlugin(ScrollTrigger)`) against the installed version's own docs/types before writing Step 3 — GSAP's API has been stable for this pattern across versions, but confirm rather than assume, per this project's established discipline for third-party packages.

- [ ] **Step 2: Write the failing test for the reduced-motion check**

`lib/gsap-reveal.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { prefersReducedMotion } from './gsap-reveal'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('prefersReducedMotion', () => {
  it('returns true when the media query matches', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(prefersReducedMotion()).toBe(true)
  })

  it('returns false when the media query does not match', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns false when matchMedia is unavailable (SSR safety)', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './gsap-reveal'"

- [ ] **Step 4: Implement the utility**

`lib/gsap-reveal.ts`:
```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function revealOnScroll(element: HTMLElement, options?: { delay?: number }): void {
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 })
    return
  }

  gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay: options?.delay ?? 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        once: true,
      },
    }
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3/3)

- [ ] **Step 6: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds — `gsap-reveal.ts`'s module-level `if (typeof window !== 'undefined')` guard must prevent any SSR/static-export crash (GSAP/ScrollTrigger touch `window`/`document`, same class of issue as the CMS project's BlockNote SSR bug found earlier — this guard is specifically here to avoid that).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/gsap-reveal.ts lib/gsap-reveal.test.ts
git commit -m "feat: add GSAP scroll-reveal utility with reduced-motion support"
```

---

### Task 14: Apply Scroll Reveals to Homepage

**Files:**
- Create: `components/RevealSection.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `revealOnScroll` (Task 13)
- Produces: `<RevealSection delay={number}>` — client component wrapper, consumed by `app/page.tsx`

- [ ] **Step 1: Build a reusable reveal wrapper**

`components/RevealSection.tsx`:
```tsx
'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { revealOnScroll } from '@/lib/gsap-reveal'

interface RevealSectionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function RevealSection({ children, delay, className }: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) revealOnScroll(ref.current, { delay })
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Wrap the homepage's three sections**

Modify `app/page.tsx` — wrap the hero `<section>`, the "Featured" `<section>`, and the "Latest Articles" `<section>` each in a `<RevealSection>` (import it from `@/components/RevealSection`), keeping each section's existing className on the `RevealSection`'s `className` prop instead of the raw `<section>` tag. Give the featured and latest sections a small stagger via the `delay` prop (e.g. `delay={0.1}` on featured, `delay={0.2}` on latest) so they don't all animate in perfectly simultaneously.

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds — this changes only wrapper elements, not the underlying data-fetching or ArticleCard rendering.

- [ ] **Step 4: Commit**

```bash
git add components/RevealSection.tsx app/page.tsx
git commit -m "feat: apply GSAP scroll-reveal animation to homepage sections"
```

---

### Task 15: Final Build Verification

**Files:**
- No new files — final regression pass across every route

**Interfaces:**
- Consumes: everything built in Tasks 1-14

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (Task 11's search-index test, Task 13's reduced-motion tests, plus every test from the original public-site build — sitemap, robots, content loader, etc.).

- [ ] **Step 2: Run a full production build**

Run: `npm run build`
Expected: succeeds with no warnings beyond what already existed before this plan (e.g. the pre-existing `middleware`→`proxy` deprecation notice in the CMS app is unrelated to this app and out of scope here).

- [ ] **Step 3: Spot-check the static output**

Run: `npx serve out` and manually check (or grep the generated HTML files for):
- `out/index.html` — header, hero, footer all present
- `out/ai/index.html` — category grid present
- `out/ai/example-post/index.html` — MDX content renders as real HTML (not raw markdown), reading-column layout applied
- `out/search/index.html` — search page present
- `out/search-index.json` — valid JSON array

- [ ] **Step 4: Commit if any fixes were needed during this pass**

If Step 1-3 surfaced any issue requiring a code change, fix it and commit with a message describing exactly what regression was caught. If everything passes cleanly, no commit is needed for this task — it's a verification gate, not a code change.
