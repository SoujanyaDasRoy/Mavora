# Mavora CMS / Writer Portal — Design Spec

## Overview

Mavora's public site (homepage, category pages, articles, static pages) is a static Next.js export, publishing via git-committed MDX files. This spec covers the second subsystem: a writer-facing CMS where you (and future writers) log in, draft articles in a Notion-style block editor, and publish — without touching git or Markdown directly.

This is a genuinely different subsystem from the public site: authenticated, stateful, backed by a real database, deployed separately. It gets its own app, its own deploy target, and its own spec/plan/build cycle, per the earlier decomposition decision.

## Goals

- A writer can log in, draft an article with a rich block editor, and publish it live without editing files or using git
- Publishing an article requires zero changes to the existing public site's code or deploy pipeline
- Support more than one writer from day one (roles: admin, writer), without requiring an auth rebuild later
- Stay on free tiers indefinitely at Mavora's realistic content pace (see Media & Storage Budget)
- Security posture appropriate for a system that can publish directly to a live public site — a compromised writer account or an injection bug here is a real incident, not just an inconvenience

## Out of Scope (v1)

- Password reset UI (handled by Clerk's own hosted flows — no custom code needed)
- Article revision history / version diffing
- Real-time collaborative editing (multiple writers editing the same draft simultaneously)
- Comment moderation (no comments system exists on the public site)
- Custom analytics beyond the three Dashboard stats defined below

## Architecture

Two separate Next.js apps, two separate Cloudflare Pages deployments:

| | Public Site (existing, unchanged) | CMS (new) |
|---|---|---|
| Rendering | Static export (`output: 'export'`) | Server-rendered (Cloudflare's Next.js adapter — verify current recommended package against the installed Next.js version at build time, the same way Tasks 4–5 had to adapt to Next 16) |
| Deploy target | Cloudflare Pages, `mavora.com` | Cloudflare Pages, separate project on a subdomain (e.g. `app.mavora.com`) |
| Backend | None — pure static files | Next.js Route Handlers running as Cloudflare Pages Functions, with direct D1/R2 bindings — no separate standalone Worker project needed |
| Auth | None | Clerk (hosted), verified via JWT in middleware |
| Content source | Git-committed MDX (`content/posts/**`) | D1 (drafts + published metadata), synced to git on publish |

**Why this split:** Next.js can't mix static export and server rendering in one `next build` — they're mutually exclusive output modes. Splitting into two apps means the public site's already-shipped, already-reviewed code and deploy pipeline (Tasks 1–8) stays completely untouched. The CMS is free to be a normal dynamic web app without compromising the public site's simplicity, speed, or cost.

**Tech stack:** Next.js (App Router, server-rendered) · TypeScript · Clerk (auth) · Cloudflare D1 (articles/drafts/writers) · Cloudflare R2 (media) · GitHub API (publish-to-git) · BlockNote (editor) · Cloudflare Web Analytics API (dashboard page-view stat) · Buttondown API (dashboard subscriber stat) · Zod (input validation, consistent with the public site's existing pattern in `lib/content.ts`).

## Data Model (D1)

No `users` or `sessions` tables — Clerk owns identity and sessions entirely. D1 only stores app-specific data:

```sql
CREATE TABLE writers (
  id TEXT PRIMARY KEY,              -- Clerk user ID
  role TEXT NOT NULL CHECK (role IN ('admin', 'writer')),
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE articles (
  id TEXT PRIMARY KEY,              -- generated UUID
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  pillar TEXT NOT NULL CHECK (pillar IN ('ai', 'technology', 'productivity', 'business')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  blocknote_content TEXT NOT NULL,  -- JSON, BlockNote's native block tree
  seo_title TEXT,
  seo_description TEXT,
  cover_image TEXT,                 -- R2 object key
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

`media.article_id` with `ON DELETE CASCADE` means deleting an article's D1 row identifies its media rows for R2 cleanup (the cleanup job still has to actually delete the R2 objects — D1's cascade only removes the metadata rows, not the R2 objects themselves).

## Auth (Clerk)

- Clerk handles: signup (invite-only, see below), login, password hashing, session issuance, MFA (available if wanted later), password reset
- Route protection via Clerk's Next.js middleware — every `/dashboard`, `/articles`, `/articles/new`, `/articles/[id]` route requires a valid session; unauthenticated requests redirect to `/login`
- Role check: on first login, a Clerk webhook (or a check on first authenticated request) creates the corresponding `writers` row if one doesn't exist. **First-ever writer is seeded as `admin` manually** (one-time setup step, not a UI flow). Subsequent writers are created via the invite flow and default to `role = 'writer'`.
- **Invite flow:** admin-only action on the Dashboard. Uses Clerk's built-in invitation API (send invite by email) — no custom token generation, no custom expiry logic, no custom email sending. Clerk delivers the invite email and handles the signup link.
- API route authorization: every Route Handler re-verifies the Clerk session server-side (never trust that middleware alone gated the request — defense in depth) and checks the `writers.role`/`author_id` before returning or mutating data. Writers can only read/write articles where `author_id` matches their own Clerk ID; admins can access all.

## Publish Flow

1. Writer opens **New Article**, drafts in BlockNote. Content autosaves to `articles.blocknote_content` as JSON on a debounce (e.g. every few seconds of inactivity), status stays `draft`.
2. Writer fills in SEO title/description, pillar, cover image, alt text for inline images.
3. Writer clicks **Publish**:
   - Server validates required fields (title, pillar, seo_description, cover_image — mirrors the frontmatter schema already enforced in `lib/content.ts`)
   - BlockNote JSON is converted to MDX (headings, bold/italic, links, lists, blockquotes, inline code, images, tables, and allowlisted embeds per the earlier editor-scope decision)
   - The resulting MDX file is committed to the `mavora` GitHub repo at `content/posts/<pillar>/<slug>.mdx` via the GitHub API (using a repo-scoped, `contents:write`-only token stored as a Cloudflare secret)
   - `articles.status` → `published`, `published_at` set
   - Cloudflare Pages' existing auto-deploy-on-push picks up the new commit and rebuilds the public site — **zero changes needed to the already-built public site pipeline**
4. Editing a published article re-commits an updated MDX file on save (same flow, overwriting the existing file at the same path).

## Pages

### 1. Login (`/login`)
Clerk's hosted/embedded sign-in component. No custom auth UI to build or secure.

### 2. Dashboard (`/dashboard`)
- Article counts: published/draft counts, scoped to the logged-in writer (all articles if admin) — plain D1 query
- Newsletter subscriber count — Buttondown API call
- Page views — Cloudflare Web Analytics API call
- R2 storage used / 10GB free tier — R2 bucket size query (see Media & Storage Budget)
- Admin only: "Invite writer" action (email input → Clerk invitation API call)

### 3. Manage Articles (`/articles`)
Table of articles (filtered to the writer's own unless admin), columns: title, pillar, status badge, last updated, actions (edit, delete). Delete removes the D1 row (cascading to `media`) and the corresponding R2 objects; if the article was published, also removes the MDX file from git via the GitHub API so the public site stops serving it on next deploy.

### 4. New Article (`/articles/new`)
BlockNote editor, pillar selector, cover image upload (client-side compressed before upload, per Media & Storage Budget), SEO fields, Publish button (flow above).

### 5. Edit Article (`/articles/[id]`)
Same editor pre-loaded with the existing `blocknote_content`, plus per-image alt-text fields and the SEO fields. Save behaves per the publish flow's step 4 if already published, or just updates the D1 draft if not yet published.

## Media & Storage Budget

Target: R2 storage never approaches its 10GB free tier within at least the first year, even at the PRD's stretch publishing pace (~730 articles/year).

- **Client-side compression before upload:** cover images resized to max 1600×900 and inline images to max 1200px wide, both converted to WebP at ~75–80% quality (target ~100–250KB each)
- **Server-side hard caps (defense in depth):** reject any single image over 800KB post-compression; cap at 6 media files per article (cover + 5 inline)
- **Worst case:** 6 × 800KB × 730 articles/year ≈ 3.5GB/year — 35% of the free tier even in the worst case; realistic average usage lands well below that
- **No egress fees on R2 at any tier** — traffic/views were never the risk, only storage
- **Orphan cleanup:** a weekly Cloudflare Cron Trigger (free tier allows these) finds R2 objects with no matching `media` row and deletes them, so abandoned drafts don't quietly eat the budget
- **Visibility:** Dashboard shows current R2 usage against the 10GB ceiling

## Security

**Authentication & sessions** — owned entirely by Clerk: password hashing, session issuance/rotation, brute-force protection, MFA availability. No custom auth code to secure.

**Authorization** — every Route Handler re-verifies the Clerk session server-side and enforces object-level checks (`WHERE author_id = ?` for writers; admins bypass the filter). UI-level hiding of admin actions is never the only gate.

**Injection & validation** — all D1 queries parameterized, never string-built. Every API input validated with Zod at the Route Handler boundary, matching the pattern already established in `lib/content.ts`. BlockNote JSON validated against its expected schema before storage or conversion.

**XSS** — BlockNote→MDX conversion escapes text content. Embeds (tweets/YouTube) restricted to an allowlist of providers, rendered in sandboxed iframes — never raw arbitrary HTML from user input. This is the same bug class as the RSS-escaping gap already found and left open on the public site; both should eventually be fixed together.

**CSRF** — Clerk's session cookie is SameSite=Lax by default; add Origin/Referer verification on state-changing Route Handlers as defense in depth.

**File uploads** — server-side mime-type allowlist (images only), size limit enforced independent of client-side compression, generated R2 keys (never client-supplied filenames, no path traversal), served with correct `Content-Type` so an uploaded file can never execute as HTML/script in-browser.

**Secrets** — GitHub token (repo-scoped, `contents:write` only), Clerk secret key, any Cloudflare Web Analytics/Buttondown API tokens: stored as Cloudflare Pages secrets, never in git, never exposed to the client bundle.

**Audit trail** — log who published/edited/deleted which article and when (a simple `audit_log` table or structured log lines are both fine for this scale) — cheap insurance for incident response on a live publication.

## Testing

- **BlockNote → MDX conversion**: unit tests with fixture block trees covering every supported element (headings, bold/italic, links, lists, blockquotes, code, images, tables, embeds) — this is the highest-value test surface in the whole subsystem, since a conversion bug ships broken content to the live public site
- **Authorization**: unit/integration tests confirming a writer cannot read/edit/delete another writer's article, and that non-admins can't hit the invite endpoint
- **Media validation**: unit tests for the server-side size/type/count caps
- **D1 queries**: integration tests against a local D1 instance (Wrangler supports this, same tooling the public site's Cloudflare Pages deploy already uses)
- **Publish flow**: integration test mocking the GitHub API, confirming the correct file path and MDX content are committed
- Pages themselves verified via build + manual browser check, consistent with the public site's existing testing philosophy

## Deployment

- New Cloudflare Pages project, separate from the public site's, deployed from the same repo (different root directory) or a separate repo — decide at plan time based on whichever keeps the GitHub Actions/Pages build config simplest
- Subdomain (e.g. `app.mavora.com`) pointed at the CMS deployment
- Secrets configured in the Cloudflare Pages dashboard: Clerk secret key, GitHub token, Buttondown API key, Cloudflare Web Analytics token
- D1 database and R2 bucket provisioned and bound to the CMS Pages project (not the public site's project, which needs neither)

## Open Follow-Ups (deferred past v1)

- Article revision history
- Real-time collaborative editing
- Comment moderation (no comments system exists yet)
- Fixing the RSS-escaping gap on the public site alongside the CMS's XSS-escaping work, since they're the same bug class
