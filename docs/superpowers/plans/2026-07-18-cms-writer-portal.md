# Mavora CMS / Writer Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the writer-facing CMS (login, dashboard, article management, BlockNote editor) as a separate server-rendered Next.js app that publishes to the existing public site by committing MDX files to git — with zero changes to the already-shipped public site.

**Architecture:** A new Next.js app (App Router, server-rendered, NOT static export) deployed as its own Cloudflare Pages project. Clerk handles auth entirely. Cloudflare D1 stores drafts/articles/writers; Cloudflare R2 stores media. Publishing converts a BlockNote block tree to MDX and commits it to the `mavora` GitHub repo via the GitHub API, which the public site's existing Cloudflare Pages auto-deploy picks up unchanged.

**Tech Stack:** Next.js (App Router, server-rendered via `@opennextjs/cloudflare`) · TypeScript · Clerk (`@clerk/nextjs`) · Cloudflare D1 · Cloudflare R2 · BlockNote (`@blocknote/core`, `@blocknote/react`) · Zod · Vitest + `@cloudflare/vitest-pool-workers` (D1/R2-backed tests) · GitHub REST API.

## Global Constraints

- Budget: $0. All services (Clerk, D1, R2, Cloudflare Pages, Cloudflare Web Analytics) on free tier.
- Solo maintainer plus future writers. Roles: `admin`, `writer` — no other roles.
- This is a SEPARATE Next.js app from the public site (`Mavora_PRD_v1.md`'s existing static export). Do not modify anything under the existing `app/`, `lib/`, `components/`, `content/` directories at the repo root — this plan's app lives in a new `cms/` directory with its own `package.json`.
- Content pillars (fixed enum, must match the public site exactly): `ai`, `technology`, `productivity`, `business`.
- Publishing writes MDX to `content/posts/<pillar>/<slug>.mdx` at the repo root (the same path the public site's `lib/content.ts` already reads) — the frontmatter shape must match `frontmatterSchema` in the public site's `lib/content.ts`: `title`, `description`, `pillar`, `tags`, `publishedAt` (`YYYY-MM-DD`), `draft`, `ogImage` (optional).
- Media hard caps: max 800KB per image (post-compression), max 6 media files per article.
- **Cloudflare's Next.js tooling moves fast.** The public site's build already discovered the installed Next.js resolved to v16, not the v14 the original plan assumed (see `docs/superpowers/plans/2026-07-18-site-flow-and-backend.md`). Treat every `@opennextjs/cloudflare`, `@clerk/nextjs`, `@blocknote/*`, and `@cloudflare/vitest-pool-workers` API in this plan the same way: verify the installed version's actual API against its own docs/types before assuming the code below is exact syntax, and adapt if it's drifted. Report any adaptation the same way Tasks 4–5 of the backend plan did.
- Never commit secrets (Clerk keys, GitHub token, Buttondown/Cloudflare Analytics tokens) to git. All secrets via Cloudflare Pages environment variables / `.dev.vars` (gitignored) locally.

---

## File Structure

```
cms/
  package.json
  wrangler.toml
  next.config.js
  vitest.config.ts
  .dev.vars.example
  migrations/
    0001_init.sql
  middleware.ts
  lib/
    cloudflare.ts        # getDb(), getMediaBucket() — binding accessors
    writers.ts            # getWriter, getOrCreateWriter, Role, Writer type
    articles.ts            # CRUD: createDraft, updateArticle, getArticleById, listArticles, deleteArticleRow
    media.ts               # validateUpload, uploadToR2, deleteMediaObjects, MAX_IMAGE_BYTES, MAX_MEDIA_PER_ARTICLE
    mdx-convert.ts          # blockNoteToMdx(blocks): string
    github.ts               # commitContentFile, deleteContentFile
    frontmatter.ts           # buildFrontmatter(article): string — mirrors public site's frontmatterSchema shape
  app/
    layout.tsx
    login/page.tsx           # Clerk <SignIn />
    dashboard/page.tsx
    articles/page.tsx         # Manage Articles table
    articles/new/page.tsx      # New Article editor
    articles/[id]/page.tsx      # Edit Article editor
    api/
      articles/route.ts         # GET (list), POST (create draft)
      articles/[id]/route.ts     # GET, PATCH, DELETE
      articles/[id]/publish/route.ts  # POST
      media/upload/route.ts       # POST
      writers/invite/route.ts      # POST (admin only)
      stats/route.ts                # GET dashboard stats
      cron/cleanup-media/route.ts    # invoked by Cron Trigger
  components/
    BlockEditor.tsx            # BlockNote wrapper, shared by New/Edit
    ArticleTable.tsx
    DashboardStats.tsx
    InviteWriterForm.tsx
```

---

### Task 1: CMS App Scaffold, D1/R2 Provisioning, Schema Migration

**Files:**
- Create: `cms/package.json`
- Create: `cms/next.config.js`
- Create: `cms/wrangler.toml`
- Create: `cms/vitest.config.ts`
- Create: `cms/.dev.vars.example`
- Create: `cms/migrations/0001_init.sql`
- Create: `cms/app/layout.tsx`
- Create: `cms/app/page.tsx`
- Test: `cms/lib/cloudflare.test.ts`

**Interfaces:**
- Produces: a working `npm run build` and `npm test` pipeline in `cms/`, a provisioned D1 database bound as `DB`, a provisioned R2 bucket bound as `MEDIA_BUCKET`, and the `writers`/`articles`/`media` tables from the spec's Data Model.

- [ ] **Step 1: Scaffold the Next.js app in `cms/`**

```bash
cd cms
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --src-dir=false --import-alias "@/*"
```

- [ ] **Step 2: Install the Cloudflare adapter and verify its current API**

```bash
npm install @opennextjs/cloudflare
```

Read the installed package's README/types (`node_modules/@opennextjs/cloudflare/`) to confirm the exact export name for reading bindings in a Route Handler (this plan assumes `getCloudflareContext()` returning `{ env }` — confirm this matches what's actually installed, per the Global Constraints note on Cloudflare tooling drift; adapt every later task's `lib/cloudflare.ts` usage if the real API differs).

- [ ] **Step 3: Configure `wrangler.toml`**

```toml
name = "mavora-cms"
compatibility_date = "2026-07-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "mavora-cms"
database_id = "REPLACE_WITH_REAL_ID_AFTER_CREATE"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "mavora-cms-media"
```

- [ ] **Step 4: Provision the D1 database and R2 bucket**

```bash
npx wrangler d1 create mavora-cms
```

Copy the printed `database_id` into `wrangler.toml`'s `database_id` field.

```bash
npx wrangler r2 bucket create mavora-cms-media
```

- [ ] **Step 5: Write the schema migration**

`cms/migrations/0001_init.sql`:
```sql
CREATE TABLE writers (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'writer')),
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  pillar TEXT NOT NULL CHECK (pillar IN ('ai', 'technology', 'productivity', 'business')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  blocknote_content TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  cover_image TEXT,
  author_id TEXT NOT NULL REFERENCES writers(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE TABLE media (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 6: Apply the migration locally and remotely**

```bash
npx wrangler d1 execute mavora-cms --local --file=migrations/0001_init.sql
npx wrangler d1 execute mavora-cms --remote --file=migrations/0001_init.sql
```

Expected: both commands report the three `CREATE TABLE` statements executed successfully.

- [ ] **Step 7: Set up Vitest with Workers bindings**

```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

`cms/vitest.config.ts`:
```ts
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
})
```

Add to `cms/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 8: Write a binding-access accessor and a sanity test**

`cms/lib/cloudflare.ts`:
```ts
import { getCloudflareContext } from '@opennextjs/cloudflare'

export function getDb(): D1Database {
  return getCloudflareContext().env.DB
}

export function getMediaBucket(): R2Bucket {
  return getCloudflareContext().env.MEDIA_BUCKET
}
```

`cms/lib/cloudflare.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'

describe('D1 schema', () => {
  it('has the writers, articles, and media tables', async () => {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('writers','articles','media')"
    ).all()
    const names = result.results.map((r: any) => r.name).sort()
    expect(names).toEqual(['articles', 'media', 'writers'])
  })
})
```

- [ ] **Step 9: Run the test**

Run: `npm test`
Expected: PASS — confirms the migration applied to the local test D1 instance that `@cloudflare/vitest-pool-workers` provisions from `wrangler.toml`.

- [ ] **Step 10: Verify the app builds and deploys as a skeleton**

```bash
npm run build
npx wrangler pages deploy .next --project-name=mavora-cms
```

Expected: build succeeds, deploy prints a `*.pages.dev` URL that loads the default Next.js homepage. This confirms the SSR-on-Cloudflare-Pages pipeline works before any CMS feature is built on top of it.

- [ ] **Step 11: Commit**

```bash
git add cms/
git commit -m "chore: scaffold CMS app, provision D1/R2, apply schema migration"
```

---

### Task 2: Clerk Integration & Route Protection

**Files:**
- Create: `cms/middleware.ts`
- Modify: `cms/app/layout.tsx`
- Create: `cms/app/login/page.tsx`
- Create: `cms/.dev.vars.example` (append)
- Test: `cms/middleware.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1 beyond the running app
- Produces: `clerkMiddleware` protecting `/dashboard`, `/articles`, `/articles/*` — later tasks' pages assume requests reaching them are already authenticated

- [ ] **Step 1: Install Clerk and verify its current Next.js App Router API**

```bash
cd cms
npm install @clerk/nextjs
```

Read `node_modules/@clerk/nextjs/README.md` to confirm the current `clerkMiddleware`/`auth()` API shape (this plan assumes the standard documented pattern; adapt if the installed version differs, per the Global Constraints note).

- [ ] **Step 2: Add Clerk keys to `.dev.vars.example`**

```
CLERK_SECRET_KEY=sk_test_replace_me
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
```

Create a real `.dev.vars` (gitignored) with actual keys from a Clerk account (manual, one-time human step — you'll need to sign up for Clerk and create an application; the implementer cannot do this, treat it like the Formspree/Buttondown signup steps from the public site's plan).

- [ ] **Step 3: Wrap the app in `ClerkProvider`**

`cms/app/layout.tsx`:
```tsx
import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 4: Add the login page**

`cms/app/login/page.tsx`:
```tsx
import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main>
      <SignIn />
    </main>
  )
}
```

- [ ] **Step 5: Add middleware protecting CMS routes**

`cms/middleware.ts`:
```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/articles(.*)',
  '/api/articles(.*)',
  '/api/media(.*)',
  '/api/writers(.*)',
  '/api/stats(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

- [ ] **Step 6: Write a test confirming an unauthenticated request to a protected route is rejected**

`cms/middleware.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { SELF } from 'cloudflare:test'

describe('route protection', () => {
  it('redirects an unauthenticated request to /dashboard', async () => {
    const response = await SELF.fetch('https://cms.example.com/dashboard', {
      redirect: 'manual',
    })
    expect([302, 307, 401]).toContain(response.status)
  })

  it('allows an unauthenticated request to /login', async () => {
    const response = await SELF.fetch('https://cms.example.com/login')
    expect(response.status).toBe(200)
  })
})
```

- [ ] **Step 7: Run the test**

Run: `npm test`
Expected: PASS. If Clerk's middleware requires live keys even for the redirect behavior, use Clerk's documented test-mode keys (check current Clerk docs for testing middleware without a live account) — report as a concern if this isn't achievable and the test needs a different approach.

- [ ] **Step 8: Commit**

```bash
git add cms/middleware.ts cms/app/layout.tsx cms/app/login/page.tsx cms/middleware.test.ts cms/.dev.vars.example
git commit -m "feat: add Clerk auth and route protection middleware"
```

---

### Task 3: Writer Sync & Manual Admin Seed

**Files:**
- Create: `cms/lib/writers.ts`
- Create: `cms/lib/writers.test.ts`
- Create: `cms/scripts/seed-admin.ts`

**Interfaces:**
- Consumes: `getDb()` from `cms/lib/cloudflare.ts` (Task 1)
- Produces:
  - `type Role = 'admin' | 'writer'`
  - `interface Writer { id: string; role: Role; displayName: string; createdAt: string }`
  - `getWriter(db: D1Database, clerkUserId: string): Promise<Writer | null>`
  - `getOrCreateWriter(db: D1Database, clerkUserId: string, displayName: string): Promise<Writer>` — creates with `role: 'writer'` if no row exists

- [ ] **Step 1: Write the failing test**

`cms/lib/writers.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { getWriter, getOrCreateWriter } from './writers'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM writers').run()
})

describe('writers', () => {
  it('returns null for a writer that does not exist', async () => {
    const writer = await getWriter(env.DB, 'clerk_nonexistent')
    expect(writer).toBeNull()
  })

  it('creates a new writer with role "writer" on first sync', async () => {
    const writer = await getOrCreateWriter(env.DB, 'clerk_abc', 'Jane Doe')
    expect(writer.id).toBe('clerk_abc')
    expect(writer.role).toBe('writer')
    expect(writer.displayName).toBe('Jane Doe')
  })

  it('returns the existing writer on a second sync without creating a duplicate', async () => {
    await getOrCreateWriter(env.DB, 'clerk_abc', 'Jane Doe')
    const second = await getOrCreateWriter(env.DB, 'clerk_abc', 'Jane Doe')
    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM writers WHERE id = ?')
      .bind('clerk_abc')
      .first<{ c: number }>()
    expect(count?.c).toBe(1)
    expect(second.id).toBe('clerk_abc')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/writers.test.ts`
Expected: FAIL with "Cannot find module './writers'"

- [ ] **Step 3: Implement the writer sync module**

`cms/lib/writers.ts`:
```ts
export type Role = 'admin' | 'writer'

export interface Writer {
  id: string
  role: Role
  displayName: string
  createdAt: string
}

function rowToWriter(row: any): Writer {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

export async function getWriter(db: D1Database, clerkUserId: string): Promise<Writer | null> {
  const row = await db.prepare('SELECT * FROM writers WHERE id = ?').bind(clerkUserId).first()
  return row ? rowToWriter(row) : null
}

export async function getOrCreateWriter(
  db: D1Database,
  clerkUserId: string,
  displayName: string
): Promise<Writer> {
  const existing = await getWriter(db, clerkUserId)
  if (existing) return existing

  await db
    .prepare('INSERT INTO writers (id, role, display_name) VALUES (?, ?, ?)')
    .bind(clerkUserId, 'writer', displayName)
    .run()

  const created = await getWriter(db, clerkUserId)
  if (!created) throw new Error(`Failed to create writer ${clerkUserId}`)
  return created
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/writers.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Write the one-time admin seed script**

`cms/scripts/seed-admin.ts`:
```ts
// One-time manual setup: run this once, locally, against the REMOTE D1 database,
// after the first-ever writer has logged in at least once (so their row exists
// with role 'writer'), to promote them to 'admin'.
//
// Usage: npx wrangler d1 execute mavora-cms --remote --command \
//   "UPDATE writers SET role = 'admin' WHERE id = 'REPLACE_WITH_CLERK_USER_ID'"
//
// This file documents the one-time step; it is intentionally not an
// automated script, since it should only ever run once by a human who has
// confirmed the correct Clerk user ID from the Clerk dashboard.
export {}
```

- [ ] **Step 6: Commit**

```bash
git add cms/lib/writers.ts cms/lib/writers.test.ts cms/scripts/seed-admin.ts
git commit -m "feat: add writer sync (getOrCreateWriter) and admin seed instructions"
```

---

### Task 4: Invite-Writer Flow

**Files:**
- Create: `cms/app/api/writers/invite/route.ts`
- Create: `cms/app/api/writers/invite/route.test.ts`
- Create: `cms/components/InviteWriterForm.tsx`

**Interfaces:**
- Consumes: `getWriter` from `cms/lib/writers.ts` (Task 3), Clerk's server-side invitation API (`clerkClient().invitations.createInvitation` — verify exact method name against the installed `@clerk/nextjs` version per Global Constraints)
- Produces: `POST /api/writers/invite` — admin-only, body `{ email: string }`, 403 for non-admins

- [ ] **Step 1: Write the failing test**

`cms/app/api/writers/invite/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(() => ({
    invitations: { createInvitation: vi.fn().mockResolvedValue({ id: 'inv_123' }) },
  })),
}))

import { auth } from '@clerk/nextjs/server'
import { POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM writers').run()
})

describe('POST /api/writers/invite', () => {
  it('rejects a non-admin writer with 403', async () => {
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('clerk_writer', 'writer', 'W')").run()
    ;(auth as any).mockResolvedValue({ userId: 'clerk_writer' })

    const request = new Request('https://cms.example.com/api/writers/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('allows an admin to invite a writer', async () => {
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('clerk_admin', 'admin', 'A')").run()
    ;(auth as any).mockResolvedValue({ userId: 'clerk_admin' })

    const request = new Request('https://cms.example.com/api/writers/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('rejects an invalid email with 400', async () => {
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('clerk_admin', 'admin', 'A')").run()
    ;(auth as any).mockResolvedValue({ userId: 'clerk_admin' })

    const request = new Request('https://cms.example.com/api/writers/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/api/writers/invite/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 3: Implement the invite route**

`cms/app/api/writers/invite/route.ts`:
```ts
import { z } from 'zod'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'

const inviteSchema = z.object({ email: z.string().email() })

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer || writer.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  const body = await request.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const client = await clerkClient()
  await client.invitations.createInvitation({ emailAddress: parsed.data.email })

  return new Response(JSON.stringify({ invited: parsed.data.email }), { status: 200 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/api/writers/invite/route.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Add the invite form component**

`cms/components/InviteWriterForm.tsx`:
```tsx
'use client'

import { useState } from 'react'

export function InviteWriterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const response = await fetch('/api/writers/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus(response.ok ? 'sent' : 'error')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="invite-email">Invite a writer</label>
      <input
        id="invite-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={status === 'sending'}>
        Send invite
      </button>
      {status === 'sent' && <p>Invitation sent.</p>}
      {status === 'error' && <p>Failed to send invitation.</p>}
    </form>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add cms/app/api/writers/invite/ cms/components/InviteWriterForm.tsx
git commit -m "feat: add admin-only invite-writer flow via Clerk invitations API"
```

---

### Task 5: Articles CRUD API (Create, Get, List, Update)

**Files:**
- Create: `cms/lib/articles.ts`
- Create: `cms/lib/articles.test.ts`
- Create: `cms/app/api/articles/route.ts`
- Create: `cms/app/api/articles/[id]/route.ts`
- Test: `cms/app/api/articles/route.test.ts`
- Test: `cms/app/api/articles/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getDb()` (Task 1), `getWriter` (Task 3)
- Produces:
  - `type ArticleStatus = 'draft' | 'published'`
  - `type Pillar = 'ai' | 'technology' | 'productivity' | 'business'`
  - `interface Article { id: string; title: string; slug: string; pillar: Pillar; status: ArticleStatus; blocknoteContent: string; seoTitle: string | null; seoDescription: string | null; coverImage: string | null; authorId: string; createdAt: string; updatedAt: string; publishedAt: string | null }`
  - `createDraft(db, input: { title: string; pillar: Pillar; authorId: string }): Promise<Article>`
  - `getArticleById(db, id: string): Promise<Article | null>`
  - `listArticles(db, filter: { authorId?: string }): Promise<Article[]>`
  - `updateArticle(db, id: string, patch: Partial<Pick<Article, 'title' | 'pillar' | 'blocknoteContent' | 'seoTitle' | 'seoDescription' | 'coverImage'>>): Promise<Article>`
  - `slugify(title: string): string`
  - `GET/POST /api/articles`, `GET/PATCH /api/articles/[id]` — all author_id-scoped for non-admins

- [ ] **Step 1: Write the failing test for the data layer**

`cms/lib/articles.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { createDraft, getArticleById, listArticles, updateArticle, slugify } from './articles'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('author_1', 'writer', 'A')").run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('author_2', 'writer', 'B')").run()
})

describe('slugify', () => {
  it('lowercases and hyphenates a title', () => {
    expect(slugify('Apple Unveils M4 MacBook Air')).toBe('apple-unveils-m4-macbook-air')
  })
})

describe('createDraft', () => {
  it('creates a draft article with a generated slug', async () => {
    const article = await createDraft(env.DB, { title: 'My First Post', pillar: 'ai', authorId: 'author_1' })
    expect(article.status).toBe('draft')
    expect(article.slug).toBe('my-first-post')
    expect(article.authorId).toBe('author_1')
    expect(article.blocknoteContent).toBe('[]')
  })
})

describe('getArticleById / listArticles', () => {
  it('returns null for a missing article', async () => {
    expect(await getArticleById(env.DB, 'nonexistent')).toBeNull()
  })

  it('lists only the given author\'s articles when authorId filter is set', async () => {
    await createDraft(env.DB, { title: 'Post A', pillar: 'ai', authorId: 'author_1' })
    await createDraft(env.DB, { title: 'Post B', pillar: 'technology', authorId: 'author_2' })

    const mine = await listArticles(env.DB, { authorId: 'author_1' })
    expect(mine).toHaveLength(1)
    expect(mine[0].title).toBe('Post A')

    const all = await listArticles(env.DB, {})
    expect(all).toHaveLength(2)
  })
})

describe('updateArticle', () => {
  it('updates title and blocknoteContent, bumping updatedAt', async () => {
    const article = await createDraft(env.DB, { title: 'Draft', pillar: 'business', authorId: 'author_1' })
    const updated = await updateArticle(env.DB, article.id, {
      title: 'Updated Title',
      blocknoteContent: '[{"type":"paragraph"}]',
    })
    expect(updated.title).toBe('Updated Title')
    expect(updated.blocknoteContent).toBe('[{"type":"paragraph"}]')
    expect(updated.updatedAt).not.toBe(article.updatedAt)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/articles.test.ts`
Expected: FAIL with "Cannot find module './articles'"

- [ ] **Step 3: Implement the articles data layer**

`cms/lib/articles.ts`:
```ts
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
  fields.push("updated_at = datetime('now')")

  values.push(id)
  await db.prepare(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  const updated = await getArticleById(db, id)
  if (!updated) throw new Error(`Article ${id} not found after update`)
  return updated
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/articles.test.ts`
Expected: PASS (6/6)

- [ ] **Step 5: Write the failing test for the list/create API route**

`cms/app/api/articles/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { GET, POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W1')").run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('admin1', 'admin', 'Admin')").run()
})

describe('GET /api/articles', () => {
  it('returns only the caller\'s articles for a writer', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Mine', pillar: 'ai' }),
    }))

    const response = await GET(new Request('https://x/api/articles'))
    const body = await response.json() as any[]
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Mine')
  })
})

describe('POST /api/articles', () => {
  it('creates a draft owned by the authenticated writer', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    const response = await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Draft', pillar: 'business' }),
    }))
    expect(response.status).toBe(201)
    const body = await response.json() as any
    expect(body.authorId).toBe('w1')
  })

  it('rejects an invalid pillar with 400', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })
    const response = await POST(new Request('https://x/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Bad', pillar: 'sports' }),
    }))
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- app/api/articles/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 7: Implement the list/create route**

`cms/app/api/articles/route.ts`:
```ts
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { createDraft, listArticles } from '@/lib/articles'

const createSchema = z.object({
  title: z.string().min(1),
  pillar: z.enum(['ai', 'technology', 'productivity', 'business']),
})

export async function GET(): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const articles = await listArticles(db, writer.role === 'admin' ? {} : { authorId: userId })
  return new Response(JSON.stringify(articles), { status: 200 })
}

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const article = await createDraft(db, { ...parsed.data, authorId: userId })
  return new Response(JSON.stringify(article), { status: 201 })
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- app/api/articles/route.test.ts`
Expected: PASS (3/3)

- [ ] **Step 9: Write the failing test for the single-article get/update route**

`cms/app/api/articles/[id]/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { createDraft } from '@/lib/articles'
import { GET, PATCH } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W1')").run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w2', 'writer', 'W2')").run()
})

describe('GET /api/articles/[id]', () => {
  it('returns the article to its own author', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await GET(new Request('https://x'), { params: Promise.resolve({ id: article.id }) })
    expect(response.status).toBe(200)
  })

  it('returns 403 when a different writer requests it', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await GET(new Request('https://x'), { params: Promise.resolve({ id: article.id }) })
    expect(response.status).toBe(403)
  })
})

describe('PATCH /api/articles/[id]', () => {
  it('updates the article when the caller is the author', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ title: 'Renamed' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(200)
    const body = await response.json() as any
    expect(body.title).toBe('Renamed')
  })

  it('returns 403 when a different writer attempts to update it', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await PATCH(
      new Request('https://x', { method: 'PATCH', body: JSON.stringify({ title: 'Hijacked' }) }),
      { params: Promise.resolve({ id: article.id }) }
    )
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test -- app/api/articles/[id]/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 11: Implement the single-article route**

`cms/app/api/articles/[id]/route.ts`:
```ts
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById, updateArticle } from '@/lib/articles'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  pillar: z.enum(['ai', 'technology', 'productivity', 'business']).optional(),
  blocknoteContent: z.string().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
})

async function authorizeAccess(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: new Response('Unauthorized', { status: 401 }) } as const

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return { error: new Response('Forbidden', { status: 403 }) } as const

  const article = await getArticleById(db, id)
  if (!article) return { error: new Response('Not found', { status: 404 }) } as const

  if (writer.role !== 'admin' && article.authorId !== userId) {
    return { error: new Response('Forbidden', { status: 403 }) } as const
  }

  return { db, article } as const
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error
  return new Response(JSON.stringify(result.article), { status: 200 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const updated = await updateArticle(result.db, id, parsed.data)
  return new Response(JSON.stringify(updated), { status: 200 })
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npm test -- app/api/articles/[id]/route.test.ts`
Expected: PASS (4/4)

- [ ] **Step 13: Run the full suite and commit**

Run: `npm test`
Expected: all prior tests plus these still pass.

```bash
git add cms/lib/articles.ts cms/lib/articles.test.ts cms/app/api/articles/
git commit -m "feat: add articles CRUD data layer and API routes with author-scoped authorization"
```

---

### Task 6: Delete Article (D1 + R2, Git Removal Deferred to Task 12)

**Files:**
- Modify: `cms/lib/articles.ts`
- Modify: `cms/lib/articles.test.ts`
- Modify: `cms/app/api/articles/[id]/route.ts`
- Modify: `cms/app/api/articles/[id]/route.test.ts`

**Interfaces:**
- Produces: `deleteArticleRow(db, id): Promise<void>` — deletes the article row (cascading to `media` rows per the schema's `ON DELETE CASCADE`) but does NOT delete R2 objects or git files yet (Task 7 adds R2 object deletion once `lib/media.ts` exists; Task 12 adds git file removal once `lib/github.ts` exists)
- `DELETE /api/articles/[id]` — author-scoped like GET/PATCH

- [ ] **Step 1: Add the failing test to `cms/lib/articles.test.ts`**

Append:
```ts
describe('deleteArticleRow', () => {
  it('removes the article row', async () => {
    const article = await createDraft(env.DB, { title: 'To delete', pillar: 'ai', authorId: 'author_1' })
    await deleteArticleRow(env.DB, article.id)
    expect(await getArticleById(env.DB, article.id)).toBeNull()
  })
})
```

Update the import line at the top of `cms/lib/articles.test.ts` to include `deleteArticleRow`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/articles.test.ts`
Expected: FAIL with "deleteArticleRow is not a function" or similar

- [ ] **Step 3: Implement `deleteArticleRow`**

Append to `cms/lib/articles.ts`:
```ts
export async function deleteArticleRow(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/articles.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Add the failing test for the DELETE route**

Append to `cms/app/api/articles/[id]/route.test.ts` (add `DELETE` to the import from `./route`):
```ts
describe('DELETE /api/articles/[id]', () => {
  it('deletes the article when the caller is the author', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(204)
  })

  it('returns 403 when a different writer attempts to delete it', async () => {
    const article = await createDraft(env.DB, { title: 'Mine', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- app/api/articles/[id]/route.test.ts`
Expected: FAIL with "DELETE is not exported"

- [ ] **Step 7: Implement the DELETE handler**

Append to `cms/app/api/articles/[id]/route.ts` (add `deleteArticleRow` to the `@/lib/articles` import):
```ts
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error

  await deleteArticleRow(result.db, id)
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- app/api/articles/[id]/route.test.ts`
Expected: PASS (6/6)

- [ ] **Step 9: Commit**

```bash
git add cms/lib/articles.ts cms/lib/articles.test.ts cms/app/api/articles/[id]/route.ts cms/app/api/articles/[id]/route.test.ts
git commit -m "feat: add article deletion (D1 row only; R2/git cleanup added in later tasks)"
```

---

### Task 7: Media Upload — Compression Contract, Hard Caps, R2 Storage

**Files:**
- Create: `cms/lib/media.ts`
- Create: `cms/lib/media.test.ts`
- Create: `cms/app/api/media/upload/route.ts`
- Test: `cms/app/api/media/upload/route.test.ts`

**Interfaces:**
- Consumes: `getDb()`, `getMediaBucket()` (Task 1), `getWriter` (Task 3), `getArticleById` (Task 5)
- Produces:
  - `MAX_IMAGE_BYTES = 800 * 1024`
  - `MAX_MEDIA_PER_ARTICLE = 6`
  - `validateUpload(file: { type: string; size: number }, existingCount: number): { valid: true } | { valid: false; error: string }`
  - `uploadToR2(bucket: R2Bucket, key: string, body: ArrayBuffer, contentType: string): Promise<void>`
  - `recordMedia(db, articleId, r2Key, altText): Promise<{ id: string; r2Key: string; altText: string }>`
  - `POST /api/media/upload` — multipart form with `file`, `articleId`, `altText`

- [ ] **Step 1: Write the failing test for validation and storage**

`cms/lib/media.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { validateUpload, uploadToR2, recordMedia, MAX_IMAGE_BYTES, MAX_MEDIA_PER_ARTICLE } from './media'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM media').run()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
  await env.DB.prepare(
    "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a1', 'T', 't', 'ai', 'draft', '[]', 'w1')"
  ).run()
})

describe('validateUpload', () => {
  it('accepts a JPEG under the size cap with room in the article', () => {
    const result = validateUpload({ type: 'image/jpeg', size: 500 * 1024 }, 2)
    expect(result.valid).toBe(true)
  })

  it('rejects a file over MAX_IMAGE_BYTES', () => {
    const result = validateUpload({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 }, 0)
    expect(result.valid).toBe(false)
  })

  it('rejects a non-image mime type', () => {
    const result = validateUpload({ type: 'application/pdf', size: 1000 }, 0)
    expect(result.valid).toBe(false)
  })

  it('rejects when the article already has MAX_MEDIA_PER_ARTICLE files', () => {
    const result = validateUpload({ type: 'image/webp', size: 1000 }, MAX_MEDIA_PER_ARTICLE)
    expect(result.valid).toBe(false)
  })
})

describe('uploadToR2 / recordMedia', () => {
  it('stores the object in R2 and records it in D1', async () => {
    const bucket = env.MEDIA_BUCKET
    const bytes = new TextEncoder().encode('fake-image-bytes').buffer
    await uploadToR2(bucket, 'articles/a1/cover.webp', bytes, 'image/webp')

    const stored = await bucket.get('articles/a1/cover.webp')
    expect(stored).not.toBeNull()

    const media = await recordMedia(env.DB, 'a1', 'articles/a1/cover.webp', 'A cover image')
    expect(media.r2Key).toBe('articles/a1/cover.webp')
    expect(media.altText).toBe('A cover image')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/media.test.ts`
Expected: FAIL with "Cannot find module './media'"

- [ ] **Step 3: Implement the media module**

`cms/lib/media.ts`:
```ts
export const MAX_IMAGE_BYTES = 800 * 1024
export const MAX_MEDIA_PER_ARTICLE = 6

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateUpload(
  file: { type: string; size: number },
  existingCount: number
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_IMAGE_BYTES} byte limit` }
  }
  if (existingCount >= MAX_MEDIA_PER_ARTICLE) {
    return { valid: false, error: `Article already has the maximum of ${MAX_MEDIA_PER_ARTICLE} media files` }
  }
  return { valid: true }
}

export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  await bucket.put(key, body, { httpMetadata: { contentType } })
}

export async function recordMedia(
  db: D1Database,
  articleId: string,
  r2Key: string,
  altText: string
): Promise<{ id: string; r2Key: string; altText: string }> {
  const id = crypto.randomUUID()
  await db
    .prepare('INSERT INTO media (id, article_id, r2_key, alt_text) VALUES (?, ?, ?, ?)')
    .bind(id, articleId, r2Key, altText)
    .run()
  return { id, r2Key, altText }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/media.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Write the failing test for the upload route**

`cms/app/api/media/upload/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM media').run()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
  await env.DB.prepare(
    "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a1', 'T', 't', 'ai', 'draft', '[]', 'w1')"
  ).run()
})

describe('POST /api/media/upload', () => {
  it('uploads a valid image and returns its R2 key', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const form = new FormData()
    form.append('articleId', 'a1')
    form.append('altText', 'Alt text')
    form.append('file', new File([new Uint8Array(1000)], 'photo.webp', { type: 'image/webp' }))

    const response = await POST(new Request('https://x/api/media/upload', { method: 'POST', body: form }))
    expect(response.status).toBe(201)
    const body = await response.json() as any
    expect(body.r2Key).toContain('a1')
  })

  it('rejects an oversized file with 400', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const form = new FormData()
    form.append('articleId', 'a1')
    form.append('altText', 'Alt text')
    form.append('file', new File([new Uint8Array(900 * 1024)], 'big.webp', { type: 'image/webp' }))

    const response = await POST(new Request('https://x/api/media/upload', { method: 'POST', body: form }))
    expect(response.status).toBe(400)
  })

  it('rejects an upload to an article owned by a different writer', async () => {
    ;(auth as any).mockResolvedValue({ userId: 'someone-else' })
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('someone-else', 'writer', 'X')").run()

    const form = new FormData()
    form.append('articleId', 'a1')
    form.append('altText', 'Alt text')
    form.append('file', new File([new Uint8Array(1000)], 'photo.webp', { type: 'image/webp' }))

    const response = await POST(new Request('https://x/api/media/upload', { method: 'POST', body: form }))
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- app/api/media/upload/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 7: Implement the upload route**

`cms/app/api/media/upload/route.ts`:
```ts
import { auth } from '@clerk/nextjs/server'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById } from '@/lib/articles'
import { validateUpload, uploadToR2, recordMedia } from '@/lib/media'

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const form = await request.formData()
  const articleId = form.get('articleId')
  const altText = form.get('altText')
  const file = form.get('file')

  if (typeof articleId !== 'string' || typeof altText !== 'string' || !(file instanceof File)) {
    return new Response('Invalid form data', { status: 400 })
  }

  const article = await getArticleById(db, articleId)
  if (!article) return new Response('Article not found', { status: 404 })
  if (writer.role !== 'admin' && article.authorId !== userId) {
    return new Response('Forbidden', { status: 403 })
  }

  const existingCount = await db
    .prepare('SELECT COUNT(*) as c FROM media WHERE article_id = ?')
    .bind(articleId)
    .first<{ c: number }>()

  const validation = validateUpload({ type: file.type, size: file.size }, existingCount?.c ?? 0)
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400 })
  }

  const extension = file.type.split('/')[1]
  const key = `articles/${articleId}/${crypto.randomUUID()}.${extension}`
  const bytes = await file.arrayBuffer()

  await uploadToR2(getMediaBucket(), key, bytes, file.type)
  const media = await recordMedia(db, articleId, key, altText)

  return new Response(JSON.stringify(media), { status: 201 })
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- app/api/media/upload/route.test.ts`
Expected: PASS (3/3)

- [ ] **Step 9: Commit**

```bash
git add cms/lib/media.ts cms/lib/media.test.ts cms/app/api/media/
git commit -m "feat: add image upload with size/type/count validation and R2 storage"
```

---

### Task 8: BlockEditor Component + New Article Page

**Files:**
- Create: `cms/components/BlockEditor.tsx`
- Create: `cms/app/articles/new/page.tsx`

**Interfaces:**
- Consumes: `POST /api/articles` (Task 5), `PATCH /api/articles/[id]` (Task 5)
- Produces: `<BlockEditor initialContent={string} onChange={(json: string) => void} />` — reused by Task 9's Edit Article page

- [ ] **Step 1: Install BlockNote and verify its current React API**

```bash
cd cms
npm install @blocknote/core @blocknote/react @blocknote/mantine
```

Read `node_modules/@blocknote/react/README.md` to confirm the current hook/component names (this plan assumes `useCreateBlockNote` + `<BlockNoteView editor={editor} />`, per BlockNote's documented pattern at time of writing — verify and adapt per the Global Constraints note).

- [ ] **Step 2: Build the shared editor component**

`cms/components/BlockEditor.tsx`:
```tsx
'use client'

import '@blocknote/core/fonts/inter.css'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { useEffect, useRef } from 'react'

interface BlockEditorProps {
  initialContent: string
  onChange: (json: string) => void
}

export function BlockEditor({ initialContent, onChange }: BlockEditorProps) {
  const parsed = initialContent && initialContent !== '[]' ? JSON.parse(initialContent) : undefined
  const editor = useCreateBlockNote({ initialContent: parsed })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(JSON.stringify(editor.document))
      }, 2000)
    })
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      unsubscribe?.()
    }
  }, [editor, onChange])

  return <BlockNoteView editor={editor} />
}
```

- [ ] **Step 3: Build the New Article page**

`cms/app/articles/new/page.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BlockEditor } from '@/components/BlockEditor'

const PILLARS = ['ai', 'technology', 'productivity', 'business'] as const

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState<(typeof PILLARS)[number]>('ai')
  const [articleId, setArticleId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function createDraftIfNeeded(): Promise<string> {
    if (articleId) return articleId
    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Untitled', pillar }),
    })
    const article = await response.json() as { id: string }
    setArticleId(article.id)
    return article.id
  }

  const handleEditorChange = useCallback(
    async (json: string) => {
      setSaveStatus('saving')
      const id = await createDraftIfNeeded()
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocknoteContent: json }),
      })
      setSaveStatus('saved')
    },
    [articleId, title, pillar]
  )

  return (
    <main>
      <h1>New Article</h1>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={createDraftIfNeeded}
      />
      <select value={pillar} onChange={(e) => setPillar(e.target.value as (typeof PILLARS)[number])}>
        {PILLARS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <p>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}</p>
      <BlockEditor initialContent="[]" onChange={handleEditorChange} />
      {articleId && (
        <button onClick={() => router.push(`/articles/${articleId}`)}>
          Continue editing (SEO fields, cover image, publish)
        </button>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, navigate to `/articles/new`, type a title, add some formatted text to the editor, confirm the "Saving.../Saved" indicator changes and a `GET /api/articles` call (e.g. via browser devtools network tab) shows the draft with matching `blocknoteContent`.

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: all prior tests still pass (this task adds no new automated tests — it's UI wiring over already-tested API routes, verified manually per the spec's testing philosophy for presentational code).

- [ ] **Step 6: Commit**

```bash
git add cms/components/BlockEditor.tsx cms/app/articles/new/
git commit -m "feat: add BlockNote editor component and New Article page with autosave"
```

---

### Task 9: Edit Article Page

**Files:**
- Create: `cms/app/articles/[id]/page.tsx`

**Interfaces:**
- Consumes: `<BlockEditor>` (Task 8), `GET/PATCH /api/articles/[id]` (Task 5), `POST /api/media/upload` (Task 7)

- [ ] **Step 1: Build the Edit Article page**

`cms/app/articles/[id]/page.tsx`:
```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BlockEditor } from '@/components/BlockEditor'

interface ArticleData {
  id: string
  title: string
  blocknoteContent: string
  seoTitle: string | null
  seoDescription: string | null
  coverImage: string | null
  status: 'draft' | 'published'
}

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle')

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((data: ArticleData) => {
        setArticle(data)
        setSeoTitle(data.seoTitle ?? '')
        setSeoDescription(data.seoDescription ?? '')
      })
  }, [id])

  const handleEditorChange = useCallback(
    async (json: string) => {
      await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocknoteContent: json }),
      })
    },
    [id]
  )

  async function saveSeoFields() {
    await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seoTitle, seoDescription }),
    })
  }

  async function handlePublish() {
    setPublishStatus('publishing')
    await saveSeoFields()
    const response = await fetch(`/api/articles/${id}/publish`, { method: 'POST' })
    setPublishStatus(response.ok ? 'published' : 'error')
  }

  if (!article) return <main>Loading...</main>

  return (
    <main>
      <h1>{article.title}</h1>
      <label htmlFor="seo-title">SEO title</label>
      <input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} onBlur={saveSeoFields} />
      <label htmlFor="seo-description">SEO description</label>
      <textarea
        id="seo-description"
        value={seoDescription}
        onChange={(e) => setSeoDescription(e.target.value)}
        onBlur={saveSeoFields}
      />
      <BlockEditor initialContent={article.blocknoteContent} onChange={handleEditorChange} />
      <button onClick={handlePublish} disabled={publishStatus === 'publishing'}>
        {article.status === 'published' ? 'Update published article' : 'Publish'}
      </button>
      {publishStatus === 'published' && <p>Published.</p>}
      {publishStatus === 'error' && <p>Publish failed.</p>}
    </main>
  )
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, create a draft via `/articles/new`, navigate to `/articles/[id]`, confirm the existing content loads into the editor, edit it, confirm the SEO fields save on blur.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all prior tests still pass.

- [ ] **Step 4: Commit**

```bash
git add cms/app/articles/[id]/page.tsx
git commit -m "feat: add Edit Article page with SEO fields and publish button"
```

---

### Task 10: BlockNote → MDX Conversion (Core Formatting)

**Files:**
- Create: `cms/lib/mdx-convert.ts`
- Create: `cms/lib/mdx-convert.test.ts`

**Interfaces:**
- Produces: `blockNoteToMdx(blocks: unknown[]): string` — handles paragraphs, headings (h1-h3), bold, italic, links, bullet/numbered lists, blockquotes, inline code

This is the highest-value test surface in the CMS per the spec — a conversion bug ships broken content to the live public site, the same class of issue the final backend review caught with raw markdown never rendering.

- [ ] **Step 1: Write the failing tests**

`cms/lib/mdx-convert.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { blockNoteToMdx } from './mdx-convert'

describe('blockNoteToMdx', () => {
  it('converts a paragraph with plain text', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('Hello world')
  })

  it('converts headings h1 through h3', () => {
    const blocks = [
      { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: 'Title', styles: {} }] },
      { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'Subtitle', styles: {} }] },
      { type: 'heading', props: { level: 3 }, content: [{ type: 'text', text: 'Section', styles: {} }] },
    ]
    const result = blockNoteToMdx(blocks)
    expect(result).toContain('# Title')
    expect(result).toContain('## Subtitle')
    expect(result).toContain('### Section')
  })

  it('converts bold and italic text', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'bold', styles: { bold: true } },
          { type: 'text', text: ' and ', styles: {} },
          { type: 'text', text: 'italic', styles: { italic: true } },
        ],
      },
    ]
    expect(blockNoteToMdx(blocks)).toBe('**bold** and *italic*')
  })

  it('converts a link', () => {
    const blocks = [
      {
        type: 'paragraph',
        content: [{ type: 'link', href: 'https://example.com', content: [{ type: 'text', text: 'a link', styles: {} }] }],
      },
    ]
    expect(blockNoteToMdx(blocks)).toBe('[a link](https://example.com)')
  })

  it('converts a bullet list', () => {
    const blocks = [
      { type: 'bulletListItem', content: [{ type: 'text', text: 'First', styles: {} }] },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Second', styles: {} }] },
    ]
    expect(blockNoteToMdx(blocks)).toBe('- First\n- Second')
  })

  it('converts a numbered list', () => {
    const blocks = [
      { type: 'numberedListItem', content: [{ type: 'text', text: 'First', styles: {} }] },
      { type: 'numberedListItem', content: [{ type: 'text', text: 'Second', styles: {} }] },
    ]
    expect(blockNoteToMdx(blocks)).toBe('1. First\n2. Second')
  })

  it('converts a blockquote', () => {
    const blocks = [{ type: 'quote', content: [{ type: 'text', text: 'A quote', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('> A quote')
  })

  it('converts inline code', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: 'const x = 1', styles: { code: true } }] }]
    expect(blockNoteToMdx(blocks)).toBe('`const x = 1`')
  })

  it('escapes markdown-special characters in plain text so they render literally', () => {
    const blocks = [{ type: 'paragraph', content: [{ type: 'text', text: 'Use * and _ carefully', styles: {} }] }]
    expect(blockNoteToMdx(blocks)).toBe('Use \\* and \\_ carefully')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/mdx-convert.test.ts`
Expected: FAIL with "Cannot find module './mdx-convert'"

- [ ] **Step 3: Implement the core conversion**

`cms/lib/mdx-convert.ts`:
```ts
interface TextInline {
  type: 'text'
  text: string
  styles: { bold?: boolean; italic?: boolean; code?: boolean }
}

interface LinkInline {
  type: 'link'
  href: string
  content: TextInline[]
}

type Inline = TextInline | LinkInline

interface Block {
  type: string
  props?: Record<string, unknown>
  content?: Inline[]
}

function escapeMarkdown(text: string): string {
  return text.replace(/([*_`[\]])/g, '\\$1')
}

function renderInline(inline: Inline): string {
  if (inline.type === 'link') {
    const label = inline.content.map(renderInline).join('')
    return `[${label}](${inline.href})`
  }
  let text = escapeMarkdown(inline.text)
  if (inline.styles.code) return `\`${inline.text}\``
  if (inline.styles.bold) text = `**${text}**`
  if (inline.styles.italic) text = `*${text}*`
  return text
}

function renderInlineList(content: Inline[] | undefined): string {
  return (content ?? []).map(renderInline).join('')
}

export function blockNoteToMdx(blocks: unknown[]): string {
  const lines: string[] = []
  let listBuffer: string[] = []
  let listOrdered = false

  function flushList() {
    if (listBuffer.length === 0) return
    lines.push(listBuffer.join('\n'))
    listBuffer = []
  }

  for (const raw of blocks as Block[]) {
    if (raw.type === 'bulletListItem' || raw.type === 'numberedListItem') {
      const ordered = raw.type === 'numberedListItem'
      if (listBuffer.length > 0 && ordered !== listOrdered) flushList()
      listOrdered = ordered
      const marker = ordered ? `${listBuffer.length + 1}.` : '-'
      listBuffer.push(`${marker} ${renderInlineList(raw.content)}`)
      continue
    }

    flushList()

    switch (raw.type) {
      case 'paragraph':
        lines.push(renderInlineList(raw.content))
        break
      case 'heading': {
        const level = Number(raw.props?.level ?? 1)
        lines.push(`${'#'.repeat(level)} ${renderInlineList(raw.content)}`)
        break
      }
      case 'quote':
        lines.push(`> ${renderInlineList(raw.content)}`)
        break
      default:
        lines.push(renderInlineList(raw.content))
    }
  }
  flushList()

  return lines.join('\n\n').replace(/\n\n(?=[-\d])/g, '\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/mdx-convert.test.ts`
Expected: PASS (9/9). If the list-joining/escaping edge cases don't match exactly on the first pass, adjust the joining logic in `blockNoteToMdx` (the list separator handling above is the trickiest part) until all 9 pass — do not weaken the test assertions to match broken output.

- [ ] **Step 5: Commit**

```bash
git add cms/lib/mdx-convert.ts cms/lib/mdx-convert.test.ts
git commit -m "feat: add BlockNote-to-MDX conversion for core formatting"
```

---

### Task 11: BlockNote → MDX Conversion (Tables + Allowlisted Embeds)

**Files:**
- Modify: `cms/lib/mdx-convert.ts`
- Modify: `cms/lib/mdx-convert.test.ts`

**Interfaces:**
- Extends `blockNoteToMdx` to handle `table` blocks and an allowlisted `embed` block type (`youtube`, `twitter`)

- [ ] **Step 1: Add the failing tests**

Append to `cms/lib/mdx-convert.test.ts`:
```ts
it('converts a table to a Markdown table', () => {
  const blocks = [
    {
      type: 'table',
      content: {
        rows: [
          { cells: [[{ type: 'text', text: 'Name', styles: {} }], [{ type: 'text', text: 'Role', styles: {} }]] },
          { cells: [[{ type: 'text', text: 'Ada', styles: {} }], [{ type: 'text', text: 'Admin', styles: {} }]] },
        ],
      },
    },
  ]
  const result = blockNoteToMdx(blocks)
  expect(result).toBe('| Name | Role |\n| --- | --- |\n| Ada | Admin |')
})

it('converts an allowlisted YouTube embed to a sandboxed iframe component', () => {
  const blocks = [{ type: 'embed', props: { provider: 'youtube', url: 'https://youtube.com/watch?v=abc123' } }]
  const result = blockNoteToMdx(blocks)
  expect(result).toContain('<YouTubeEmbed url="https://youtube.com/watch?v=abc123" />')
})

it('converts an allowlisted Twitter embed', () => {
  const blocks = [{ type: 'embed', props: { provider: 'twitter', url: 'https://twitter.com/user/status/123' } }]
  const result = blockNoteToMdx(blocks)
  expect(result).toContain('<TwitterEmbed url="https://twitter.com/user/status/123" />')
})

it('throws on a non-allowlisted embed provider rather than emitting raw HTML', () => {
  const blocks = [{ type: 'embed', props: { provider: 'arbitrary-iframe', url: 'https://evil.example.com' } }]
  expect(() => blockNoteToMdx(blocks)).toThrow(/not allowed/i)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/mdx-convert.test.ts`
Expected: FAIL — table/embed blocks currently fall into the `default` case and render as empty/incorrect text.

- [ ] **Step 3: Extend the conversion**

Add to `cms/lib/mdx-convert.ts` (new interfaces above `Block`, new `case` branches in the `switch`):
```ts
interface TableCell {
  cells: Inline[][]
}

interface TableContent {
  rows: TableCell[]
}

const ALLOWED_EMBED_PROVIDERS = new Set(['youtube', 'twitter'])

function renderTable(content: TableContent): string {
  const rows = content.rows.map((row) => row.cells.map((cell) => renderInlineList(cell)))
  const [header, ...body] = rows
  const headerLine = `| ${header.join(' | ')} |`
  const separatorLine = `| ${header.map(() => '---').join(' | ')} |`
  const bodyLines = body.map((row) => `| ${row.join(' | ')} |`)
  return [headerLine, separatorLine, ...bodyLines].join('\n')
}

function renderEmbed(props: Record<string, unknown> | undefined): string {
  const provider = String(props?.provider ?? '')
  const url = String(props?.url ?? '')
  if (!ALLOWED_EMBED_PROVIDERS.has(provider)) {
    throw new Error(`Embed provider "${provider}" is not allowed`)
  }
  const componentName = provider === 'youtube' ? 'YouTubeEmbed' : 'TwitterEmbed'
  return `<${componentName} url="${url}" />`
}
```

In the `switch (raw.type)` block, add before `default`:
```ts
      case 'table':
        lines.push(renderTable(raw.content as unknown as TableContent))
        break
      case 'embed':
        lines.push(renderEmbed(raw.props))
        break
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/mdx-convert.test.ts`
Expected: PASS (13/13)

- [ ] **Step 5: Commit**

```bash
git add cms/lib/mdx-convert.ts cms/lib/mdx-convert.test.ts
git commit -m "feat: extend MDX conversion with tables and allowlisted embeds"
```

**Note for a later task (not this plan):** `<YouTubeEmbed>`/`<TwitterEmbed>` components need to exist in the public site's MDX rendering pipeline (`next-mdx-remote/rsc`'s `MDXRemote` accepts a `components` prop) for these to actually render — flagged as a public-site follow-up, out of scope for the CMS itself.

---

### Task 12: GitHub Publish Client + Wire Publish/Delete

**Files:**
- Create: `cms/lib/frontmatter.ts`
- Create: `cms/lib/frontmatter.test.ts`
- Create: `cms/lib/github.ts`
- Create: `cms/lib/github.test.ts`
- Create: `cms/app/api/articles/[id]/publish/route.ts`
- Test: `cms/app/api/articles/[id]/publish/route.test.ts`
- Modify: `cms/app/api/articles/[id]/route.ts` (DELETE handler calls `deleteContentFile` for published articles)
- Modify: `cms/app/api/articles/[id]/route.test.ts`

**Interfaces:**
- Consumes: `Article` type (Task 5), `blockNoteToMdx` (Tasks 10-11)
- Produces:
  - `buildFrontmatter(article: Article): string` — matches the public site's `frontmatterSchema` shape exactly
  - `commitContentFile(path: string, content: string, message: string): Promise<void>`
  - `deleteContentFile(path: string, message: string): Promise<void>`
  - `POST /api/articles/[id]/publish`

- [ ] **Step 1: Write the failing test for frontmatter generation**

`cms/lib/frontmatter.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildFrontmatter } from './frontmatter'
import type { Article } from './articles'

const baseArticle: Article = {
  id: 'a1',
  title: 'My Post',
  slug: 'my-post',
  pillar: 'ai',
  status: 'draft',
  blocknoteContent: '[]',
  seoTitle: 'My Post — SEO Title',
  seoDescription: 'A short description under 160 chars.',
  coverImage: 'articles/a1/cover.webp',
  authorId: 'w1',
  createdAt: '2026-07-18T00:00:00Z',
  updatedAt: '2026-07-18T00:00:00Z',
  publishedAt: null,
}

describe('buildFrontmatter', () => {
  it('produces YAML frontmatter matching the public site schema', () => {
    const yaml = buildFrontmatter(baseArticle)
    expect(yaml).toContain('title: "My Post — SEO Title"')
    expect(yaml).toContain('description: "A short description under 160 chars."')
    expect(yaml).toContain('pillar: "ai"')
    expect(yaml).toContain('draft: false')
    expect(yaml).toMatch(/publishedAt: "\d{4}-\d{2}-\d{2}"/)
  })

  it('falls back to the article title when seoTitle is not set', () => {
    const yaml = buildFrontmatter({ ...baseArticle, seoTitle: null })
    expect(yaml).toContain('title: "My Post"')
  })

  it('throws if seoDescription is missing, since the public site requires it', () => {
    expect(() => buildFrontmatter({ ...baseArticle, seoDescription: null })).toThrow(/description/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/frontmatter.test.ts`
Expected: FAIL with "Cannot find module './frontmatter'"

- [ ] **Step 3: Implement frontmatter generation**

`cms/lib/frontmatter.ts`:
```ts
import type { Article } from './articles'

export function buildFrontmatter(article: Article): string {
  if (!article.seoDescription) {
    throw new Error('Cannot publish: seoDescription is required (matches the public site\'s frontmatter schema)')
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/frontmatter.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Write the failing test for the GitHub client**

`cms/lib/github.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { commitContentFile, deleteContentFile } from './github'

const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  global.fetch = originalFetch
})

describe('commitContentFile', () => {
  it('PUTs base64-encoded content to the GitHub Contents API', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 404 })) // no existing file
      .mockResolvedValueOnce(new Response(JSON.stringify({ content: {} }), { status: 201 }))

    await commitContentFile('content/posts/ai/my-post.mdx', '---\ntitle: "x"\n---\nBody', 'publish: my-post')

    const putCall = (global.fetch as any).mock.calls[1]
    expect(putCall[0]).toContain('content/posts/ai/my-post.mdx')
    const body = JSON.parse(putCall[1].body)
    expect(Buffer.from(body.content, 'base64').toString('utf-8')).toBe('---\ntitle: "x"\n---\nBody')
    expect(body.message).toBe('publish: my-post')
  })
})

describe('deleteContentFile', () => {
  it('DELETEs the file using its current sha', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({ sha: 'abc123' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    await deleteContentFile('content/posts/ai/my-post.mdx', 'unpublish: my-post')

    const deleteCall = (global.fetch as any).mock.calls[1]
    const body = JSON.parse(deleteCall[1].body)
    expect(body.sha).toBe('abc123')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- lib/github.test.ts`
Expected: FAIL with "Cannot find module './github'"

- [ ] **Step 7: Implement the GitHub client**

`cms/lib/github.ts`:
```ts
const GITHUB_API = 'https://api.github.com'
const REPO = 'SoujanyaDasRoy/Mavora'

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_CONTENT_TOKEN
  if (!token) throw new Error('GITHUB_CONTENT_TOKEN is not set')
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

async function getExistingSha(path: string): Promise<string | undefined> {
  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    headers: authHeaders(),
  })
  if (response.status === 404) return undefined
  const data = await response.json() as { sha: string }
  return data.sha
}

export async function commitContentFile(path: string, content: string, message: string): Promise<void> {
  const sha = await getExistingSha(path)
  const base64Content = Buffer.from(content, 'utf-8').toString('base64')

  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ message, content: base64Content, ...(sha ? { sha } : {}) }),
  })

  if (!response.ok) {
    throw new Error(`GitHub commit failed for ${path}: ${response.status}`)
  }
}

export async function deleteContentFile(path: string, message: string): Promise<void> {
  const sha = await getExistingSha(path)
  if (!sha) return // already gone

  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ message, sha }),
  })

  if (!response.ok) {
    throw new Error(`GitHub delete failed for ${path}: ${response.status}`)
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- lib/github.test.ts`
Expected: PASS (2/2)

- [ ] **Step 9: Add `GITHUB_CONTENT_TOKEN` to `.dev.vars.example`**

Append to `cms/.dev.vars.example`:
```
GITHUB_CONTENT_TOKEN=github_pat_replace_me_scoped_to_contents_write_only
```

Create a real GitHub Personal Access Token (fine-grained, scoped to the `Mavora` repo only, `Contents: Read and write` permission — no other permissions) and add it to your real `.dev.vars` and to Cloudflare Pages' environment variables. This is a manual, one-time human step — the implementer cannot create this token.

- [ ] **Step 10: Write the failing test for the publish route**

`cms/app/api/articles/[id]/publish/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/github', () => ({
  commitContentFile: vi.fn().mockResolvedValue(undefined),
  deleteContentFile: vi.fn().mockResolvedValue(undefined),
}))

import { auth } from '@clerk/nextjs/server'
import { commitContentFile } from '@/lib/github'
import { createDraft, updateArticle, getArticleById } from '@/lib/articles'
import { POST } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
})

describe('POST /api/articles/[id]/publish', () => {
  it('commits the MDX file and marks the article published', async () => {
    const article = await createDraft(env.DB, { title: 'My Post', pillar: 'ai', authorId: 'w1' })
    await updateArticle(env.DB, article.id, { seoDescription: 'A description.' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })

    expect(response.status).toBe(200)
    expect(commitContentFile).toHaveBeenCalledWith(
      'content/posts/ai/my-post.mdx',
      expect.any(String),
      expect.stringContaining('my-post')
    )

    const updated = await getArticleById(env.DB, article.id)
    expect(updated?.status).toBe('published')
    expect(updated?.publishedAt).not.toBeNull()
  })

  it('returns 400 when seoDescription is missing', async () => {
    const article = await createDraft(env.DB, { title: 'No SEO', pillar: 'ai', authorId: 'w1' })
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(400)
  })

  it('returns 403 when the caller is not the article\'s author', async () => {
    const article = await createDraft(env.DB, { title: 'Not mine', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w2', 'writer', 'W2')").run()
    ;(auth as any).mockResolvedValue({ userId: 'w2' })

    const response = await POST(new Request('https://x', { method: 'POST' }), {
      params: Promise.resolve({ id: article.id }),
    })
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npm test -- app/api/articles/[id]/publish/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 12: Implement the publish route**

`cms/app/api/articles/[id]/publish/route.ts`:
```ts
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { getArticleById } from '@/lib/articles'
import { blockNoteToMdx } from '@/lib/mdx-convert'
import { buildFrontmatter } from '@/lib/frontmatter'
import { commitContentFile } from '@/lib/github'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const article = await getArticleById(db, id)
  if (!article) return new Response('Not found', { status: 404 })
  if (writer.role !== 'admin' && article.authorId !== userId) {
    return new Response('Forbidden', { status: 403 })
  }

  let frontmatter: string
  try {
    frontmatter = buildFrontmatter({ ...article, publishedAt: article.publishedAt ?? new Date().toISOString() })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 400 })
  }

  const body = blockNoteToMdx(JSON.parse(article.blocknoteContent))
  const mdx = `${frontmatter}\n${body}\n`
  const path = `content/posts/${article.pillar}/${article.slug}.mdx`

  await commitContentFile(path, mdx, `publish: ${article.slug}`)

  await db
    .prepare("UPDATE articles SET status = 'published', published_at = COALESCE(published_at, datetime('now')) WHERE id = ?")
    .bind(id)
    .run()

  return new Response(JSON.stringify({ published: true, path }), { status: 200 })
}
```

- [ ] **Step 13: Run test to verify it passes**

Run: `npm test -- app/api/articles/[id]/publish/route.test.ts`
Expected: PASS (3/3)

- [ ] **Step 14: Wire git removal into the DELETE handler for published articles**

Add the failing case to `cms/app/api/articles/[id]/route.test.ts` (add `vi.mock('@/lib/github', ...)` at the top matching Step 10's pattern, import `deleteContentFile`):
```ts
it('removes the git file when deleting a published article', async () => {
  const article = await createDraft(env.DB, { title: 'Published', pillar: 'ai', authorId: 'w1' })
  await env.DB.prepare("UPDATE articles SET status = 'published' WHERE id = ?").bind(article.id).run()
  ;(auth as any).mockResolvedValue({ userId: 'w1' })

  const response = await DELETE(new Request('https://x', { method: 'DELETE' }), {
    params: Promise.resolve({ id: article.id }),
  })
  expect(response.status).toBe(204)
  expect(deleteContentFile).toHaveBeenCalledWith('content/posts/ai/published.mdx', expect.stringContaining('published'))
})
```

Run: `npm test -- app/api/articles/[id]/route.test.ts` — expect FAIL (deleteContentFile not called).

Update the `authorizeAccess` helper (defined in Task 5) to also return `userId`, since Task 16 needs it for audit logging and the current version only returns `{ db, article }`. Replace the whole function:
```ts
async function authorizeAccess(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: new Response('Unauthorized', { status: 401 }) } as const

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return { error: new Response('Forbidden', { status: 403 }) } as const

  const article = await getArticleById(db, id)
  if (!article) return { error: new Response('Not found', { status: 404 }) } as const

  if (writer.role !== 'admin' && article.authorId !== userId) {
    return { error: new Response('Forbidden', { status: 403 }) } as const
  }

  return { db, article, userId } as const
}
```

Update `cms/app/api/articles/[id]/route.ts`'s `DELETE` handler:
```ts
import { deleteContentFile } from '@/lib/github'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const result = await authorizeAccess(id)
  if ('error' in result) return result.error

  if (result.article.status === 'published') {
    const path = `content/posts/${result.article.pillar}/${result.article.slug}.mdx`
    await deleteContentFile(path, `unpublish: ${result.article.slug}`)
  }

  await deleteArticleRow(result.db, id)
  return new Response(null, { status: 204 })
}
```

Run: `npm test -- app/api/articles/[id]/route.test.ts` — expect PASS (7/7). This also fixes `GET`/`PATCH`, which destructure `result.db`/`result.article` from the same helper and are unaffected by the added `userId` field.

- [ ] **Step 15: Run the full suite and commit**

Run: `npm test`
Expected: all tests across the project pass.

```bash
git add cms/lib/frontmatter.ts cms/lib/frontmatter.test.ts cms/lib/github.ts cms/lib/github.test.ts cms/app/api/articles/[id]/publish/ cms/app/api/articles/[id]/route.ts cms/app/api/articles/[id]/route.test.ts cms/.dev.vars.example
git commit -m "feat: add GitHub publish client, wire publish flow and git removal on delete"
```

---

### Task 13: Manage Articles Page

**Files:**
- Create: `cms/components/ArticleTable.tsx`
- Create: `cms/app/articles/page.tsx`

**Interfaces:**
- Consumes: `GET /api/articles` (Task 5), `DELETE /api/articles/[id]` (Task 6/12)

- [ ] **Step 1: Build the article table component**

`cms/components/ArticleTable.tsx`:
```tsx
'use client'

interface ArticleRow {
  id: string
  title: string
  pillar: string
  status: 'draft' | 'published'
  updatedAt: string
}

interface ArticleTableProps {
  articles: ArticleRow[]
  onDelete: (id: string) => void
}

export function ArticleTable({ articles, onDelete }: ArticleTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Pillar</th>
          <th>Status</th>
          <th>Last updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr key={article.id}>
            <td>{article.title}</td>
            <td>{article.pillar}</td>
            <td>{article.status}</td>
            <td>{new Date(article.updatedAt).toLocaleDateString()}</td>
            <td>
              <a href={`/articles/${article.id}`}>Edit</a>
              <button onClick={() => onDelete(article.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Build the Manage Articles page**

`cms/app/articles/page.tsx`:
```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArticleTable } from '@/components/ArticleTable'

interface ArticleRow {
  id: string
  title: string
  pillar: string
  status: 'draft' | 'published'
  updatedAt: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([])

  const loadArticles = useCallback(() => {
    fetch('/api/articles').then((r) => r.json()).then(setArticles)
  }, [])

  useEffect(() => { loadArticles() }, [loadArticles])

  async function handleDelete(id: string) {
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    loadArticles()
  }

  return (
    <main>
      <h1>Manage Articles</h1>
      <Link href="/articles/new">New Article</Link>
      <ArticleTable articles={articles} onDelete={handleDelete} />
    </main>
  )
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, create a couple of drafts, navigate to `/articles`, confirm they list, confirm delete removes a row and calls the API.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all prior tests still pass.

- [ ] **Step 5: Commit**

```bash
git add cms/components/ArticleTable.tsx cms/app/articles/page.tsx
git commit -m "feat: add Manage Articles table page"
```

---

### Task 14: Dashboard — Article Counts & R2 Storage Usage

**Files:**
- Create: `cms/app/api/stats/route.ts`
- Test: `cms/app/api/stats/route.test.ts`
- Create: `cms/components/DashboardStats.tsx`
- Create: `cms/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `listArticles` (Task 5), `getMediaBucket` (Task 1)
- Produces: `GET /api/stats` returning `{ draftCount: number; publishedCount: number; r2UsedBytes: number; r2FreeTierBytes: number }` — subscriber count and page views are added in Task 15, kept separate since those two need real external API credentials this task's tests shouldn't depend on

- [ ] **Step 1: Write the failing test**

`cms/app/api/stats/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
import { auth } from '@clerk/nextjs/server'
import { createDraft, updateArticle } from '@/lib/articles'
import { GET } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
  await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
})

describe('GET /api/stats', () => {
  it('counts drafts and published articles scoped to the caller', async () => {
    const a1 = await createDraft(env.DB, { title: 'A', pillar: 'ai', authorId: 'w1' })
    await createDraft(env.DB, { title: 'B', pillar: 'ai', authorId: 'w1' })
    await env.DB.prepare("UPDATE articles SET status = 'published' WHERE id = ?").bind(a1.id).run()
    ;(auth as any).mockResolvedValue({ userId: 'w1' })

    const response = await GET()
    const body = await response.json() as any
    expect(body.draftCount).toBe(1)
    expect(body.publishedCount).toBe(1)
    expect(typeof body.r2UsedBytes).toBe('number')
    expect(body.r2FreeTierBytes).toBe(10 * 1024 * 1024 * 1024)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/api/stats/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 3: Implement the stats route**

`cms/app/api/stats/route.ts`:
```ts
import { auth } from '@clerk/nextjs/server'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { getWriter } from '@/lib/writers'
import { listArticles } from '@/lib/articles'

const R2_FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024

async function getR2UsedBytes(): Promise<number> {
  const bucket = getMediaBucket()
  let cursor: string | undefined
  let total = 0
  do {
    const listing = await bucket.list({ cursor })
    for (const obj of listing.objects) total += obj.size
    cursor = listing.truncated ? listing.cursor : undefined
  } while (cursor)
  return total
}

export async function GET(): Promise<Response> {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const db = getDb()
  const writer = await getWriter(db, userId)
  if (!writer) return new Response('Forbidden', { status: 403 })

  const articles = await listArticles(db, writer.role === 'admin' ? {} : { authorId: userId })
  const draftCount = articles.filter((a) => a.status === 'draft').length
  const publishedCount = articles.filter((a) => a.status === 'published').length
  const r2UsedBytes = await getR2UsedBytes()

  return new Response(
    JSON.stringify({ draftCount, publishedCount, r2UsedBytes, r2FreeTierBytes: R2_FREE_TIER_BYTES }),
    { status: 200 }
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/api/stats/route.test.ts`
Expected: PASS (1/1)

- [ ] **Step 5: Build the Dashboard stats display component**

`cms/components/DashboardStats.tsx`:
```tsx
interface Stats {
  draftCount: number
  publishedCount: number
  r2UsedBytes: number
  r2FreeTierBytes: number
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const usedGb = (stats.r2UsedBytes / (1024 * 1024 * 1024)).toFixed(2)
  const freeGb = (stats.r2FreeTierBytes / (1024 * 1024 * 1024)).toFixed(0)

  return (
    <dl>
      <dt>Draft articles</dt>
      <dd>{stats.draftCount}</dd>
      <dt>Published articles</dt>
      <dd>{stats.publishedCount}</dd>
      <dt>Media storage used</dt>
      <dd>{usedGb}GB / {freeGb}GB free tier</dd>
    </dl>
  )
}
```

- [ ] **Step 6: Build the Dashboard page**

`cms/app/dashboard/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/components/DashboardStats'
import { InviteWriterForm } from '@/components/InviteWriterForm'

interface Stats {
  draftCount: number
  publishedCount: number
  r2UsedBytes: number
  r2FreeTierBytes: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats)
  }, [])

  return (
    <main>
      <h1>Dashboard</h1>
      {stats && <DashboardStats stats={stats} />}
      <InviteWriterForm />
    </main>
  )
}
```

- [ ] **Step 7: Verify manually and run the full suite**

Run: `npm run dev`, navigate to `/dashboard`, confirm counts and storage display correctly.
Run: `npm test` — all tests pass.

- [ ] **Step 8: Commit**

```bash
git add cms/app/api/stats/ cms/components/DashboardStats.tsx cms/app/dashboard/
git commit -m "feat: add Dashboard with article counts and R2 storage usage"
```

---

### Task 15: Dashboard — Subscriber Count & Page Views

**Files:**
- Modify: `cms/app/api/stats/route.ts`
- Modify: `cms/app/api/stats/route.test.ts`
- Modify: `cms/components/DashboardStats.tsx`
- Modify: `cms/.dev.vars.example`

**Interfaces:**
- Extends `GET /api/stats`'s response with `subscriberCount: number | null` and `pageViews30d: number | null` (`null` when the external API call fails, so a Buttondown/Cloudflare Analytics outage doesn't take down the whole Dashboard)

- [ ] **Step 1: Add `.dev.vars.example` entries**

Append to `cms/.dev.vars.example`:
```
BUTTONDOWN_API_KEY=replace_me
CLOUDFLARE_ANALYTICS_API_TOKEN=replace_me
CLOUDFLARE_ZONE_TAG=replace_me
```

These reuse the Buttondown account already created for the public site's newsletter signup, plus a new Cloudflare API token (Account → Analytics → Read scope) and the zone tag for `mavora.com`, obtainable from the Cloudflare dashboard — manual, one-time human steps.

- [ ] **Step 2: Add the failing test**

Modify `cms/app/api/stats/route.test.ts` to mock `fetch` for the two external calls and assert the new fields:
```ts
it('includes subscriber count and page views, falling back to null on API failure', async () => {
  ;(auth as any).mockResolvedValue({ userId: 'w1' })
  global.fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ count: 42 }), { status: 200 })) // Buttondown
    .mockResolvedValueOnce(new Response('server error', { status: 500 })) // Cloudflare Analytics fails

  const response = await GET()
  const body = await response.json() as any
  expect(body.subscriberCount).toBe(42)
  expect(body.pageViews30d).toBeNull()
})
```

Add `import { vi, afterEach } from 'vitest'` if not already present, and restore `global.fetch` in an `afterEach` to avoid leaking the mock into other tests in the file (matching the pattern used in `cms/lib/github.test.ts`).

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- app/api/stats/route.test.ts`
Expected: FAIL — `subscriberCount`/`pageViews30d` not yet present on the response.

- [ ] **Step 4: Implement the two integrations with graceful fallback**

Add to `cms/app/api/stats/route.ts`:
```ts
async function getSubscriberCount(): Promise<number | null> {
  const apiKey = process.env.BUTTONDOWN_API_KEY
  if (!apiKey) return null
  try {
    const response = await fetch('https://api.buttondown.com/v1/subscribers?type=regular', {
      headers: { Authorization: `Token ${apiKey}` },
    })
    if (!response.ok) return null
    const data = await response.json() as { count: number }
    return data.count
  } catch {
    return null
  }
}

async function getPageViews30d(): Promise<number | null> {
  const token = process.env.CLOUDFLARE_ANALYTICS_API_TOKEN
  const zoneTag = process.env.CLOUDFLARE_ZONE_TAG
  if (!token || !zoneTag) return null
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/graphql`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { viewer { zones(filter: { zoneTag: "${zoneTag}" }) { httpRequests1dGroups(limit: 30) { sum { pageViews } } } } }`,
      }),
    })
    if (!response.ok) return null
    const data = await response.json() as any
    const groups = data?.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
    return groups.reduce((sum: number, g: any) => sum + (g.sum?.pageViews ?? 0), 0)
  } catch {
    return null
  }
}
```

Update the `GET` handler's response to include both, fetched concurrently:
```ts
  const [r2UsedBytes, subscriberCount, pageViews30d] = await Promise.all([
    getR2UsedBytes(),
    getSubscriberCount(),
    getPageViews30d(),
  ])

  return new Response(
    JSON.stringify({
      draftCount,
      publishedCount,
      r2UsedBytes,
      r2FreeTierBytes: R2_FREE_TIER_BYTES,
      subscriberCount,
      pageViews30d,
    }),
    { status: 200 }
  )
```

(Remove the old single `const r2UsedBytes = await getR2UsedBytes()` line it replaces.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- app/api/stats/route.test.ts`
Expected: PASS (2/2)

- [ ] **Step 6: Update the Dashboard display**

Modify `cms/components/DashboardStats.tsx` to accept and render the two new nullable fields:
```tsx
interface Stats {
  draftCount: number
  publishedCount: number
  r2UsedBytes: number
  r2FreeTierBytes: number
  subscriberCount: number | null
  pageViews30d: number | null
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const usedGb = (stats.r2UsedBytes / (1024 * 1024 * 1024)).toFixed(2)
  const freeGb = (stats.r2FreeTierBytes / (1024 * 1024 * 1024)).toFixed(0)

  return (
    <dl>
      <dt>Draft articles</dt>
      <dd>{stats.draftCount}</dd>
      <dt>Published articles</dt>
      <dd>{stats.publishedCount}</dd>
      <dt>Media storage used</dt>
      <dd>{usedGb}GB / {freeGb}GB free tier</dd>
      <dt>Newsletter subscribers</dt>
      <dd>{stats.subscriberCount ?? 'Unavailable'}</dd>
      <dt>Page views (last 30 days)</dt>
      <dd>{stats.pageViews30d ?? 'Unavailable'}</dd>
    </dl>
  )
}
```

- [ ] **Step 7: Run the full suite and commit**

Run: `npm test`
Expected: all tests pass.

```bash
git add cms/app/api/stats/ cms/components/DashboardStats.tsx cms/.dev.vars.example
git commit -m "feat: add subscriber count and page-view stats to Dashboard"
```

---

### Task 16: Security Hardening — CSRF Check & Audit Log

**Files:**
- Create: `cms/lib/csrf.ts`
- Create: `cms/lib/csrf.test.ts`
- Create: `cms/lib/audit.ts`
- Create: `cms/lib/audit.test.ts`
- Create: `cms/migrations/0002_audit_log.sql`
- Modify: `cms/middleware.ts`
- Modify: `cms/app/api/articles/route.ts` (log create)
- Modify: `cms/app/api/articles/[id]/route.ts` (log update/delete)
- Modify: `cms/app/api/articles/[id]/publish/route.ts` (log publish)

**Interfaces:**
- Produces:
  - `isTrustedOrigin(request: Request, expectedOrigin: string): boolean`
  - `recordAuditEvent(db, { actorId, action, articleId }): Promise<void>`

- [ ] **Step 1: Add the audit log migration**

`cms/migrations/0002_audit_log.sql`:
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  article_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Apply it:
```bash
npx wrangler d1 execute mavora-cms --local --file=migrations/0002_audit_log.sql
npx wrangler d1 execute mavora-cms --remote --file=migrations/0002_audit_log.sql
```

- [ ] **Step 2: Write the failing test for CSRF checking**

`cms/lib/csrf.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isTrustedOrigin } from './csrf'

describe('isTrustedOrigin', () => {
  it('accepts a request whose Origin header matches the expected origin', () => {
    const request = new Request('https://app.mavora.com/api/articles', {
      method: 'POST',
      headers: { Origin: 'https://app.mavora.com' },
    })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(true)
  })

  it('rejects a request with a mismatched Origin header', () => {
    const request = new Request('https://app.mavora.com/api/articles', {
      method: 'POST',
      headers: { Origin: 'https://evil.example.com' },
    })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(false)
  })

  it('rejects a request with no Origin header on a mutating method', () => {
    const request = new Request('https://app.mavora.com/api/articles', { method: 'POST' })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(false)
  })

  it('does not require Origin on a GET request', () => {
    const request = new Request('https://app.mavora.com/api/articles', { method: 'GET' })
    expect(isTrustedOrigin(request, 'https://app.mavora.com')).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/csrf.test.ts`
Expected: FAIL with "Cannot find module './csrf'"

- [ ] **Step 4: Implement the CSRF check**

`cms/lib/csrf.ts`:
```ts
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function isTrustedOrigin(request: Request, expectedOrigin: string): boolean {
  if (SAFE_METHODS.has(request.method)) return true
  const origin = request.headers.get('Origin')
  return origin === expectedOrigin
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/csrf.test.ts`
Expected: PASS (4/4)

- [ ] **Step 6: Wire the CSRF check into middleware**

Modify `cms/middleware.ts`, adding the check inside the protected-route branch (requires `CMS_ORIGIN` set as an env var — add `CMS_ORIGIN=http://localhost:3000` to `.dev.vars.example` and the real production origin in Cloudflare Pages env vars):

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { isTrustedOrigin } from '@/lib/csrf'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/articles(.*)',
  '/api/articles(.*)',
  '/api/media(.*)',
  '/api/writers(.*)',
  '/api/stats(.*)',
])

const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  if (isApiRoute(req) && !isTrustedOrigin(req, process.env.CMS_ORIGIN ?? '')) {
    return new Response('Forbidden: origin check failed', { status: 403 })
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

- [ ] **Step 7: Write the failing test for the audit log module**

`cms/lib/audit.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { recordAuditEvent } from './audit'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM audit_log').run()
})

describe('recordAuditEvent', () => {
  it('inserts a row with actor, action, and article id', async () => {
    await recordAuditEvent(env.DB, { actorId: 'w1', action: 'publish', articleId: 'a1' })
    const row = await env.DB.prepare('SELECT * FROM audit_log WHERE actor_id = ?').bind('w1').first()
    expect(row?.action).toBe('publish')
    expect(row?.article_id).toBe('a1')
  })
})
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npm test -- lib/audit.test.ts`
Expected: FAIL with "Cannot find module './audit'"

- [ ] **Step 9: Implement the audit log module**

`cms/lib/audit.ts`:
```ts
export async function recordAuditEvent(
  db: D1Database,
  event: { actorId: string; action: string; articleId?: string }
): Promise<void> {
  await db
    .prepare('INSERT INTO audit_log (id, actor_id, action, article_id) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), event.actorId, event.action, event.articleId ?? null)
    .run()
}
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npm test -- lib/audit.test.ts`
Expected: PASS (1/1)

- [ ] **Step 11: Wire audit logging into publish, update, and delete**

Add `await recordAuditEvent(db, { actorId: userId, action: 'publish', articleId: id })` immediately after the successful status update in `cms/app/api/articles/[id]/publish/route.ts` (import `recordAuditEvent` from `@/lib/audit`; `userId` is already in scope there from that route's own `auth()` call).

Add `await recordAuditEvent(result.db, { actorId: result.userId, action: 'delete', articleId: id })` in the `DELETE` handler of `cms/app/api/articles/[id]/route.ts`, before the `return new Response(null, { status: 204 })` — `result.userId` is available because Task 12 already updated `authorizeAccess` to return it alongside `db`/`article`.

- [ ] **Step 12: Run the full suite and commit**

Run: `npm test`
Expected: all tests pass.

```bash
git add cms/lib/csrf.ts cms/lib/csrf.test.ts cms/lib/audit.ts cms/lib/audit.test.ts cms/migrations/0002_audit_log.sql cms/middleware.ts cms/app/api/articles/
git commit -m "feat: add CSRF origin check and audit logging for publish/delete"
```

---

### Task 17: Weekly R2 Orphan Cleanup (Cron Trigger)

**Files:**
- Create: `cms/app/api/cron/cleanup-media/route.ts`
- Test: `cms/app/api/cron/cleanup-media/route.test.ts`
- Modify: `cms/wrangler.toml`

**Interfaces:**
- Produces: `GET /api/cron/cleanup-media` — deletes R2 objects with no matching `media.r2_key` row, invoked by a Cloudflare Cron Trigger

- [ ] **Step 1: Write the failing test**

`cms/app/api/cron/cleanup-media/route.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { GET } from './route'

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM media').run()
  await env.DB.prepare('DELETE FROM articles').run()
  await env.DB.prepare('DELETE FROM writers').run()
})

describe('GET /api/cron/cleanup-media', () => {
  it('deletes an R2 object with no matching media row and keeps one that has a row', async () => {
    const bucket = env.MEDIA_BUCKET
    await bucket.put('articles/orphan/no-row.webp', new Uint8Array([1]))
    await bucket.put('articles/kept/has-row.webp', new Uint8Array([1]))

    await env.DB.prepare("INSERT INTO writers (id, role, display_name) VALUES ('w1', 'writer', 'W')").run()
    await env.DB.prepare(
      "INSERT INTO articles (id, title, slug, pillar, status, blocknote_content, author_id) VALUES ('a1', 'T', 't', 'ai', 'draft', '[]', 'w1')"
    ).run()
    await env.DB.prepare(
      "INSERT INTO media (id, article_id, r2_key, alt_text) VALUES ('m1', 'a1', 'articles/kept/has-row.webp', '')"
    ).run()

    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json() as { deleted: number }
    expect(body.deleted).toBe(1)

    expect(await bucket.get('articles/orphan/no-row.webp')).toBeNull()
    expect(await bucket.get('articles/kept/has-row.webp')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/api/cron/cleanup-media/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 3: Implement the cleanup route**

`cms/app/api/cron/cleanup-media/route.ts`:
```ts
import { getDb, getMediaBucket } from '@/lib/cloudflare'

export async function GET(): Promise<Response> {
  const db = getDb()
  const bucket = getMediaBucket()

  const knownKeys = new Set(
    (await db.prepare('SELECT r2_key FROM media').all()).results.map((r: any) => r.r2_key)
  )

  let cursor: string | undefined
  let deleted = 0
  do {
    const listing = await bucket.list({ cursor })
    for (const obj of listing.objects) {
      if (!knownKeys.has(obj.key)) {
        await bucket.delete(obj.key)
        deleted += 1
      }
    }
    cursor = listing.truncated ? listing.cursor : undefined
  } while (cursor)

  return new Response(JSON.stringify({ deleted }), { status: 200 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/api/cron/cleanup-media/route.test.ts`
Expected: PASS (1/1)

- [ ] **Step 5: Register the Cron Trigger**

Add to `cms/wrangler.toml`:
```toml
[triggers]
crons = ["0 3 * * 1"]
```

This fires weekly (Monday 03:00 UTC). Note: a `wrangler.toml` Cron Trigger invokes a `scheduled` handler, not an HTTP route directly — check the current OpenNext Cloudflare adapter's documented pattern for wiring a Cron Trigger to call this route (or an equivalent `scheduled` export) at deploy time, since this is exactly the kind of Cloudflare-tooling detail flagged in the Global Constraints as likely to need verification against what's actually installed.

- [ ] **Step 6: Run the full suite and commit**

Run: `npm test`
Expected: all tests pass.

```bash
git add cms/app/api/cron/ cms/wrangler.toml
git commit -m "feat: add weekly R2 orphan cleanup via Cron Trigger"
```

---

### Task 18: CMS Deployment Configuration

**Files:**
- Create: `cms/DEPLOY.md`
- No application code — deployment configuration and documentation only, mirroring the public site's Task 8

**Interfaces:**
- Consumes: nothing new — documents how to deploy everything built in Tasks 1–17

- [ ] **Step 1: Write the CMS deployment guide**

`cms/DEPLOY.md`:
```markdown
# Deploying the Mavora CMS

This is a separate Cloudflare Pages project from the public site — do not
connect it to the same Pages project.

## One-time setup (manual, human required)

1. Create a Cloudflare Pages project pointed at this repo, root directory
   `cms/`, build command `npm run build`, framework preset per whatever
   `@opennextjs/cloudflare` documents at deploy time (verify against the
   installed adapter version).
2. Point a subdomain (e.g. `app.mavora.com`) at this Pages project via
   Cloudflare DNS.
3. Bind the existing `mavora-cms` D1 database and `mavora-cms-media` R2
   bucket to this Pages project (Settings → Functions → Bindings).
4. Set these environment variables in the Cloudflare Pages dashboard
   (Settings → Environment variables), matching `.dev.vars.example`:
   - `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from your
     Clerk application)
   - `GITHUB_CONTENT_TOKEN` (fine-grained PAT, scoped to the `Mavora` repo,
     `Contents: Read and write` only)
   - `BUTTONDOWN_API_KEY` (same Buttondown account as the public site's
     newsletter signup)
   - `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ZONE_TAG` (Cloudflare
     dashboard → My Profile → API Tokens, Account Analytics Read scope)
   - `CMS_ORIGIN` set to the production subdomain, e.g.
     `https://app.mavora.com`
5. Register the Cron Trigger (Task 17) per whatever the deployed adapter
   requires to route it to `/api/cron/cleanup-media`.
6. Seed the first admin: after the first writer logs in once (creating
   their `writers` row with role `writer`), run the command in
   `scripts/seed-admin.ts` against the remote D1 database to promote them.

## Ongoing deploys

Push to the connected branch — Cloudflare Pages auto-deploys, same as the
public site.

## Verifying a deploy

- Visit `/login`, sign in
- Create a draft at `/articles/new`, add some formatted content, save
- Visit `/dashboard`, confirm article counts and storage usage display
- Publish the draft, confirm a new commit appears in the `Mavora` GitHub
  repo under `content/posts/<pillar>/<slug>.mdx`, and that the public
  site's own Cloudflare Pages deploy picks it up and the article goes live
- Delete the article, confirm the git file is removed and the public site
  drops it on its next deploy
```

- [ ] **Step 2: Commit**

```bash
git add cms/DEPLOY.md
git commit -m "docs: add CMS deployment guide"
```

---

## Self-Review Notes (for the plan author, not a task)

- **Spec coverage:** all 5 pages (Login: Task 2; Dashboard: Tasks 14–15; Manage Articles: Task 13; New Article: Task 8; Edit Article: Task 9) are covered. Auth/roles (Tasks 2–4), D1 schema (Task 1), publish flow (Tasks 10–12), media budget (Task 7), all Security section items (Tasks 4, 5, 6, 7, 16) and the R2 orphan cleanup (Task 17) are each covered by a specific task.
- **Deferred/out-of-scope items from the spec** (password reset, revision history, real-time collaboration, comment moderation, the RSS-escaping fix) are intentionally absent from this plan, matching the spec's own "Out of Scope"/"Open Follow-Ups" sections.
- **One cross-cutting item to watch during execution:** `authorizeAccess` in `cms/app/api/articles/[id]/route.ts` is extended twice after its Task 5 introduction (Task 12 needs `userId` returned for audit logging in Task 16) — the dispatch for Task 16 explicitly calls out updating its return type rather than assuming it's untouched since Task 5.
