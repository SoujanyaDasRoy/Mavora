# Mavora CMS — Admin Dashboard Design

**Date:** 2026-07-26
**Status:** Draft — awaiting user approval
**Scope:** Complete admin for Mavora editorial CMS (Articles + Writers + Tags + Media + Settings)

## Background

Mavora is an editorial publication ("Knowledge for the ambitious") with a Next.js 16 marketing site (root `app/`) and a separate Next.js 16 admin at `cms/`. The admin was wiped (23 components deleted) and is being rebuilt. The CMS already had a divergent "Ethereal Glass / Deep OLED" dark theme, which departs from the marketing brand. This spec replaces that with the actual Mavora brand tokens so the admin reads as part of one product.

## Goals

- Rebuild the admin UI from scratch with the Mavora marketing brand (warm cream + warm dark, red `#cf2743` as a single accent, four pillar colors, Space Grotesk + Inter + JetBrains Mono + Outfit).
- Ship a complete admin in one effort: dashboard, articles list, article create/edit, writers, invites, tags, media, settings.
- Add a light theme that matches the marketing light tokens; keep a dark theme that matches the marketing dark tokens. Default follows system preference; user can override (persisted to `localStorage`).
- Install Magic UI (not yet in `cms/package.json`) and use it where it adds genuine value — **not** on every component. Magic UI is the polish layer, not the foundation.
- Use BlockNote (already installed) for the article block editor.
- Preserve existing API routes, D1 schema, R2 media binding, Clerk auth, and middleware. No backend rewrites.

## Non-Goals (this spec)

- Public site / marketing changes (handled by the root app).
- New D1 migrations. The schema in `migrations/0001_init.sql` and `0002_audit_log.sql` is taken as-is.
- Custom analytics / metrics collection. The dashboard reads from existing tables (articles, users, activity events).
- Email delivery. The existing writers invite flow (route handler at `cms/app/api/writers/invite/`) is reused.
- E2E tests. Vitest unit tests on server actions and pure utilities only.

## Brand System (reused from marketing `app/globals.css`)

The marketing site defines the canonical tokens. The CMS adopts them exactly. No new palette.

### Light theme

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAF6EE` | App background (warm cream) |
| `--color-bg-secondary` | `#F3EDE0` | Card / sidebar background |
| `--color-bg-tertiary` | `#EAE2D2` | Subtle elevation, hover |
| `--color-fg` | `#0d0d0d` | Primary text |
| `--color-fg-muted` | `#5C5850` | Secondary text |
| `--color-fg-subtle` | `#6E6A60` | Tertiary text, captions |
| `--color-border` | `#E5DEC9` | Hairline dividers |
| `--color-border-strong` | `#D8CEB4` | Inputs, focused borders |
| `--color-accent` | `#cf2743` | Single primary action + 48px accent rule |
| `--color-accent-hover` | `#b31f38` | Accent hover state |
| Pillar AI | text `#6C4BB4` / bg `#F3EFFF` / border `#E5DFFF` | AI tag pills |
| Pillar Tech | text `#1A7492` / bg `#EEF9FC` / border `#D1EDF4` | Technology tag pills |
| Pillar Prod | text `#2C7A3C` / bg `#F0F9F1` / border `#D7EED9` | Productivity tag pills |
| Pillar Bus | text `#CF2743` / bg `#FFF0F2` / border `#FFD4DA` | Business tag pills (note: shares accent red — used only for the Business label, not for primary actions) |

### Dark theme

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#393836` | App background (warm dark, not blue-tinted) |
| `--color-bg-secondary` | `#302F2D` | Card / sidebar |
| `--color-bg-tertiary` | `#272624` | Subtle elevation |
| `--color-fg` | `#f0f0f0` | Primary text |
| `--color-fg-muted` | `#b0b0b0` | Secondary text |
| `--color-fg-subtle` | `#a8a8a8` | Tertiary text |
| `--color-border` | `#4A4846` | Hairline dividers |
| `--color-border-strong` | `#565452` | Inputs, focused borders |
| `--color-accent` | `#cf2743` | Same red, kept restrained |
| Pillar AI | `#B392FF` | AI |
| Pillar Tech | `#5CC0E2` | Technology |
| Pillar Prod | `#76D087` | Productivity |
| Pillar Bus | `#FF788D` | Business |

### Typography

| Role | Family | Loaded via | Used for |
|---|---|---|---|
| Display | Space Grotesk | `next/font/google` in `cms/app/layout.tsx` | Page H1, dashboard hero, section labels |
| Body | Inter | `next/font/google` | All UI text |
| Mono | JetBrains Mono | `next/font/google` | Eyebrow labels, datelines, table IDs, numeric rank badges |
| Article | Outfit | `next/font/google` | Article preview headings inside admin |

**Font registration:** add all four via `next/font/google` in `cms/app/layout.tsx` with CSS variables `--font-display`, `--font-sans`, `--font-mono`, `--font-article`. Apply via Tailwind v4 `@theme` block in `cms/app/globals.css`.

### Radius

Inherit the marketing scale: `--radius-sm 0.25rem`, `--radius-md 0.375rem`, `--radius-lg 0.5rem`, `--radius-xl 0.75rem`, `--radius-4xl 2rem`. CMS uses `lg` (0.5rem) as the default for cards/inputs.

### Distinguishing rules carried over from marketing

- Red is reserved for the single primary action per view. Secondary buttons are ghost / outline. Destructive actions use a muted neutral style + confirmation modal, not red.
- Section dividers use a 48px red gradient rule: `linear-gradient(to right, var(--color-accent) 48px, var(--color-border) 48px)`. Used in the dashboard and article detail header.
- Eyebrow labels in JetBrains Mono uppercase, e.g. `PUBLISHED · ISSUE 27`.
- Numeric rank badges in JetBrains Mono: `01`, `02`, `03`.
- Subtle paper texture: `bg-noise` SVG fractal noise overlay at 0.015 opacity applied to `<body>`.
- Logo: `cms/public/logo.png` (same asset as the marketing site). Sidebar shows it 180×51 at top, 32px height in collapsed state.

## Architecture

### Routes

The admin lives under a single route group `(admin)`. All admin pages share the layout with sidebar + topbar.

```
cms/app/
  (admin)/
    layout.tsx                  # Sidebar + topbar shell, theme provider
    page.tsx                    # Dashboard (bento layout)
    articles/
      page.tsx                  # List w/ filters, search, status pills
      new/page.tsx              # Create — BlockNote editor, title, slug, tags, status
      [id]/page.tsx             # Edit — same form, pre-filled
    writers/
      page.tsx                  # Members table (active + invited)
      invites/page.tsx          # Invite form (name, email, role)
    tags/page.tsx               # Tag taxonomy, pillar-color preview
    media/page.tsx              # R2-backed asset library (grid + uploader)
    settings/page.tsx           # Org name, branding, danger zone
  api/                          # existing — unchanged
  login/page.tsx                # existing
  signup/page.tsx               # existing
  layout.tsx                    # existing — add font registration
  page.tsx                      # existing — root redirect to /dashboard
  globals.css                   # replace Ethereal Glass with Mavora tokens
```

The middleware in `cms/middleware.ts` already protects `/dashboard(.*)`, `/articles(.*)`, and the listed `/api/*` namespaces. The new `(admin)` group will live at the same paths (`/dashboard`, `/articles`, `/writers`, `/tags`, `/media`, `/settings`) — no middleware change. To keep the marketing site clean, the root of the admin remains `/dashboard` (the `(admin)` group has no URL prefix).

### Component map

```
cms/components/
  admin/
    sidebar.tsx                 # Persistent left nav, collapsible to icon-rail
    sidebar-nav-item.tsx        # Active-state pill, mono label
    issue-counter.tsx            # Footer widget: "Issue 27 · W30"
    topbar.tsx                   # Org switcher, global search, theme toggle, user
    org-switcher.tsx             # (single-org for now, disabled dropdown w/ tooltip "coming soon")
    global-search.tsx            # ⌘K palette — searches articles + writers
    theme-toggle.tsx             # Sun/Moon, system default
    user-menu.tsx                # Clerk UserButton wrapper
    page-header.tsx              # Eyebrow + H1 + 48px red rule + actions
    stat-card.tsx                # Big number, delta, sparkline, mono label
    sparkline.tsx                # SVG mini line chart
    publishing-cadence-chart.tsx # 30-day area chart (Recharts)
    writer-leaderboard.tsx       # Top 5 writers by articles this period
    activity-feed.tsx            # Recent events: published, edited, invited
    tag-marquee.tsx              # Magic UI marquee w/ pillar-color tag pills
    drafts-table.tsx             # "In progress" — author, last edited, word count
    article-table.tsx            # Main list — title, author, status, views, last edit
    article-form.tsx             # Title, slug, status, tags, cover, BlockNote body
    status-pill.tsx              # Published / Draft / Scheduled / Archived
    invite-writer-form.tsx       # Name, email, role select
    media-grid.tsx               # R2 assets, lazy-loaded images
    media-uploader.tsx           # Drop zone → POST /api/media/upload
    empty-state.tsx              # Editorial copy ("The page is blank. Time to write the first one.")
    theme-provider.tsx           # next-themes wrapper, persists to localStorage
  magicui/                      # curated subset, copied from magicui registry
    marquee.tsx
    text-shimmer.tsx
    number-ticker.tsx
  ui/                           # shadcn primitives — see "shadcn registry" below
    button.tsx
    card.tsx
    input.tsx
    textarea.tsx
    label.tsx
    badge.tsx
    table.tsx
    dropdown-menu.tsx
    dialog.tsx
    sheet.tsx
    tabs.tsx
    avatar.tsx
    separator.tsx
    scroll-area.tsx
    tooltip.tsx
    command.tsx
    popover.tsx
    select.tsx
    switch.tsx
    sonner.tsx                   # toast (Sonner)
    skeleton.tsx
```

### shadcn registry

`components.json` exists at the CMS root with `style: "base-nova"`, `baseColor: "neutral"`, `iconLibrary: "lucide"`. shadcn primitives are generated into `cms/components/ui/` on first install. The `neutral` baseColor is overridden after generation by replacing the `neutral` CSS variables in `cms/app/globals.css` with the Mavora token block (the same block from `app/globals.css` at the marketing root). The `components.json` `baseColor` value is left as `neutral` to avoid a regen churn; the runtime visual outcome is the Mavora palette.

### Magic UI

Install `magicui` package. Import only:
- `marquee` — for the dashboard tag cloud (one usage, one signature moment).
- `number-ticker` — for the stat cards' headline number (one usage per card, 4 cards).
- `text-shimmer` — for the "Loading…" skeleton in the dashboard's stat cards while data fetches (one usage).

No other Magic UI component is imported in this build. Rationale: every additional Magic UI component increases bundle weight and contributes to a "look like every other AI-generated dashboard" reading. The marquee + ticker + shimmer together are the editorial flourish; the rest of the UI is sober shadcn + Tailwind.

### Theme system

- Provider: `next-themes` (install in CMS). Persists to `localStorage` under `cms-theme`. System preference is the default; user override wins.
- `ThemeToggle` in the topbar cycles `system → light → dark → system`.
- The `:root` block in `cms/app/globals.css` holds the light tokens; the `.dark` block holds the dark tokens. Both wrapped in `@layer base`.
- shadcn's `neutral` baseColor vars are replaced in the same file with Mavora equivalents — no shadcn regen needed.
- `cms/components/admin/theme-provider.tsx` is a client component wrapping `{children}` with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

### Data flow

- **Reads:** Server components fetch directly from D1 via the existing `getRequestContext().env.DB` pattern (see `cms/app/api/stats/route.ts` for a reference shape). Query helpers live in `cms/lib/queries/` (new directory): `articles.ts`, `writers.ts`, `tags.ts`, `media.ts`, `activity.ts`, `stats.ts`. Each helper exports a pure async function that takes the D1 binding and returns typed rows. No ORM — keep raw D1 prepared statements, matching existing style.
- **Writes:** Server Actions live in `cms/lib/actions/` and are invoked from client components via form `action` props. The existing API route handlers (`/api/articles`, `/api/writers/invite`, etc.) remain the source of truth and continue to be exercised by tests. Server Actions call those same handlers internally to avoid duplicating validation logic.
- **Validation:** zod schemas in `cms/lib/schemas/` (new). Shared between Server Actions and API routes. Existing inline zod usage in route handlers is left alone; new validation uses the shared schemas.
- **Auth:** Clerk's `auth()` helper at the top of every Server Action and protected server component. Reuses the writer-role check pattern from `cms/lib/auth-writer.ts`.
- **CSRF/origin:** Server Actions and route handlers both call `isTrustedOrigin(req, CMS_ORIGIN)` from `cms/lib/csrf.ts` before mutating.
- **Audit:** All write actions call `cms/lib/audit.ts` with `{action, entity, entityId, actor, diff}` after success. Reuses existing `0002_audit_log.sql` schema.

### Dashboard data shape (mocked first, real later)

The dashboard page is implemented in two phases:

**Phase 1 (this spec):** Reads from `cms/lib/queries/stats.ts` which returns hard-coded numbers keyed to a 30-day window. Numbers are obvious placeholders (`—`). The component tree, layout, and copy are final.

**Phase 2 (out of scope, follow-up spec):** Replace the placeholder numbers with real aggregations. The query function signatures are written in Phase 1 so the swap is mechanical.

The four stat cards and the cadence chart all use Phase 1 placeholders. The recent activity feed uses real D1 data from the start (the `activity_events` table from `0002_audit_log.sql` is already populated by existing write paths).

## Component contracts

Each admin component follows the same shape: a server component by default, opt-in to `"use client"` only when interactivity is required (form state, theme toggle, command palette, marquee animation, BlockNote editor, media uploader). All other pages are pure server components for fast first paint.

### `StatCard`

Props: `{ label: string; value: number; delta: number; sparkline: number[]; pill?: string }`. Renders a 1.5rem Space Grotesk display number (uses `<NumberTicker>`), a `Mono` label above, a delta arrow with the appropriate green/red/neutral utility class (green reserved for positive only when the metric's "positive" direction is unambiguous — e.g. views up, drafts down), and a 60×24 sparkline SVG at the bottom right. The whole card is 240px tall, padded 24px, radius `--radius-lg`. Hover: border shifts to `--color-border-strong` and `bg-noise` opacity bumps from 0.015 to 0.03.

### `Sidebar`

Width 16rem expanded, 4rem collapsed. Persists collapse state to `localStorage` under `cms-sidebar`. Items: Dashboard, Articles, Writers, Tags, Media, Settings (the last is muted until at least one article exists). The footer contains `<IssueCounter>` which displays `Issue {n} · W{ww}` calculated from the start of the year (`weekNumber = ceil((Date.now() - startOfYear) / (7 * 86400_000))`, `issueNumber = weekNumber`). The footer is the editorial signature — it asserts this is a publication, not a generic SaaS.

### `Topbar`

Height 56px, hairline border bottom, sticky. Left: `<OrgSwitcher>` (disabled with "Coming soon" tooltip for now). Center: `<GlobalSearch>` — a `<Command>` palette triggered by `⌘K` / `Ctrl K`, fuzzy searches article titles and writer names. Right: `<ThemeToggle>`, `<UserMenu>` (Clerk `UserButton`).

### `PageHeader`

Renders an eyebrow (`Mono`, uppercase, `--color-fg-muted`), a 2rem Space Grotesk H1, the 48px red accent rule, and a right-aligned action area. Used on every admin page above the content.

### `ArticleForm`

Two-column layout on `lg+` (8-col content, 4-col meta). Title (`<Input>`), slug (auto-derived from title, editable), excerpt (`<Textarea>`, 3 rows), cover image (R2 picker or URL), tags (`<Command>` multi-select with pillar-color preview), status (`<Select>`: Draft / Published / Scheduled / Archived), scheduled-at (datetime-local, only enabled when status = Scheduled). Body: BlockNote editor (already installed). Save: Server Action. The 8-col / 4-col split collapses to single column under `lg`.

### `BlockEditor`

BlockNote editor instance with the existing Mantine theme. The form owns the BlockNote state via `@blocknote/react`'s `useCreateBlockNote` inside a client component, and the serialized JSON is posted to the Server Action on save.

### `StatusPill`

Renders one of four variants. Each is a `Badge` with the appropriate pillar color (Published = Productivity green, Scheduled = Tech blue, Draft = neutral outline, Archived = muted gray with strikethrough text). Color is supplementary; the label is the primary signal.

### `EmptyState`

A centered card with a 1rem Space Grotesk headline, a 0.875rem Inter paragraph, and a single primary action (red, but only one per page — the rest are ghost). Copy follows the editorial voice from the PRD: "The page is blank. Time to write the first one." Not "No data."

## Error handling

- Server Actions return `{ ok: true, data } | { ok: false, error: { code, message } }`. Client components check `ok` and show a Sonner toast on failure.
- Network/server errors use the Sonner error variant with the message from the action's `error.message`. Never expose stack traces.
- Form validation errors render inline below each field (zod's `flatten().fieldErrors` is the source).
- 401/403 responses from API routes redirect to `/login` (auth) or render a permission-denied page (role check).
- D1 query errors in server components render a `<RouteError>` component (new) with a "Try again" button that triggers `router.refresh()`.

## Testing

- Vitest unit tests for new pure utilities: `lib/queries/stats.ts` (with a mocked D1 binding), `lib/schemas/*.ts`, `lib/issue-counter.ts`.
- Vitest unit tests for new Server Actions using the existing pattern in `cms/app/api/articles/route.test.ts` as reference.
- The existing `wrangler.test.toml` config plus `@cloudflare/vitest-pool-workers` continue to work — no test infra change.
- Visual smoke test: `npm run dev` then manual click-through of every page in both themes. The first run is the gate; no automated visual regression in this spec.

## Open questions

None. User has confirmed: editorial content (articles + writers + tags), both themes with system default, Magic UI marquee + animated stats + bento, complete admin. Brand tokens pulled from existing marketing `app/globals.css`. Logo file is `cms/public/logo.png`.

## Risks

- **Tailwind v4 + shadcn `neutral` baseColor** — the `neutral` baseColor vars from shadcn have to be replaced with Mavora's tokens. If a shadcn primitive references a class that uses a neutral var I missed, the result is a single component with a stale color. Mitigation: after `shadcn add` runs, grep the generated files for any reference to `neutral` color names and map them to Mavora vars.
- **BlockNote bundle weight** — the editor is client-only and heavy. Mitigation: lazy-load the editor route via `next/dynamic` with `ssr: false` on `cms/app/(admin)/articles/new/page.tsx` and `[id]/page.tsx`.
- **Theme flash on load** — first paint in the wrong theme is jarring. Mitigation: inline script in `cms/app/layout.tsx` reads `localStorage.cms-theme` (or `prefers-color-scheme`) and sets `class="dark"` on `<html>` before React hydrates.
- **Pillar Business + Accent red collision** — both are `#cf2743`. Mitigation: pillar Business uses its own `--pillar-bus-*` tokens (text/bg/border). The single-accent rule still holds: red is used as a fill for the Business label and the 48px rule divider, but no Business tag pill is ever the *primary action* of a view.
- **D1 query cost on the dashboard** — the bento layout makes ~6 queries per page load. Mitigation: each query is small (LIMIT 10, single aggregation, no joins over the full table). If a future spec adds complex joins, add a 60s KV cache layer.
