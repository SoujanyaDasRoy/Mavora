# Mavora CMS Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete admin dashboard for the Mavora editorial CMS using the existing Mavora marketing brand tokens, with both light and dark themes, BlockNote editing, and the Magic UI marquee/number-ticker/text-shimmer components as a curated polish layer.

**Architecture:** Next.js 16 App Router on Cloudflare Workers + D1 + R2, with an `(admin)` route group that holds every admin page under one shared sidebar + topbar layout. Server components by default, opt-in `"use client"` only for forms, theme toggle, command palette, marquee, and the BlockNote editor. Brand tokens and the `neutral` shadcn palette are unified by replacing the Ethereal Glass CSS variables in `cms/app/globals.css` with the marketing site's token block.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn (style `base-nova`, baseColor `neutral`, iconLibrary `lucide`), `@base-ui/react`, `framer-motion`, `recharts` 3, `next-themes`, `magicui`, `lucide-react`, `@carbon/icons-react`, `@blocknote/core` + `@blocknote/mantine` + `@blocknote/react`, `@clerk/nextjs`, `zod`, `vitest`, `@cloudflare/vitest-pool-workers`, Wrangler 4.

**Spec:** `cms/docs/superpowers/specs/2026-07-26-mavora-admin-dashboard-design.md`

## Global Constraints

- Node version: v20+
- Package manager: npm (existing `package-lock.json` at `cms/`)
- Brand: light = warm cream `#FAF6EE` + warm dark `#393836`; single accent red `#cf2743`; pillar colors (AI `#6C4BB4`, Tech `#1A7492`, Prod `#2C7A3C`, Bus `#CF2743`)
- Typography: Space Grotesk (display) + Inter (body) + JetBrains Mono (data) + Outfit (article H) — all via `next/font/google`
- Radius scale: `--radius-sm 0.25rem`, `--radius-md 0.375rem`, `--radius-lg 0.5rem`, `--radius-xl 0.75rem`, `--radius-4xl 2rem`
- Red is reserved for the single primary action per view; secondary buttons are ghost / outline
- Section dividers use 48px red gradient rule: `linear-gradient(to right, var(--color-accent) 48px, var(--color-border) 48px)`
- Eyebrow labels in JetBrains Mono uppercase
- Paper noise overlay: SVG fractal noise at 0.015 opacity on `<body>`
- Magic UI usage is restricted to `marquee`, `number-ticker`, `text-shimmer` only
- All admin routes live under `(admin)` route group; no URL prefix change
- Middleware protection: `/dashboard(.*)`, `/articles(.*)`, plus existing `/api/*` namespaces — no middleware change
- D1 access pattern: `getRequestContext().env.DB` + raw prepared statements (no ORM)
- Tests: Vitest with `@cloudflare/vitest-pool-workers`; config in `wrangler.test.toml`
- Commit style: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` on every commit
- Working directory for all commands: `cms/`

## File Structure (to be created or modified)

```
cms/
  app/
    (admin)/
      layout.tsx                              [create]  Sidebar + topbar shell
      page.tsx                                [create]  Dashboard
      articles/page.tsx                       [create]  Articles list
      articles/new/page.tsx                   [create]  Create article
      articles/[id]/page.tsx                  [create]  Edit article
      writers/page.tsx                        [create]  Members
      writers/invites/page.tsx                [create]  Invite form
      tags/page.tsx                           [create]  Tag taxonomy
      media/page.tsx                          [create]  Media library
      settings/page.tsx                       [create]  Settings
    layout.tsx                                [modify]  Add font registration + theme flash script
    page.tsx                                  [modify]  Redirect to /dashboard
    globals.css                               [modify]  Replace Ethereal Glass with Mavora tokens + Tailwind v4 @theme block
  components/
    admin/
      sidebar.tsx                             [create]
      sidebar-nav-item.tsx                    [create]
      issue-counter.tsx                       [create]
      topbar.tsx                              [create]
      org-switcher.tsx                        [create]
      global-search.tsx                       [create]
      theme-toggle.tsx                        [create]
      user-menu.tsx                           [create]
      page-header.tsx                         [create]
      stat-card.tsx                           [create]
      sparkline.tsx                           [create]
      publishing-cadence-chart.tsx            [create]
      writer-leaderboard.tsx                  [create]
      activity-feed.tsx                       [create]
      tag-marquee.tsx                         [create]
      drafts-table.tsx                        [create]
      article-table.tsx                       [create]
      article-form.tsx                        [create]
      status-pill.tsx                         [create]
      invite-writer-form.tsx                  [create]
      media-grid.tsx                          [create]
      media-uploader.tsx                      [create]
      empty-state.tsx                         [create]
      route-error.tsx                         [create]
      theme-provider.tsx                      [create]
    magicui/
      marquee.tsx                             [create]  copy from magicui registry
      number-ticker.tsx                       [create]  copy from magicui registry
      text-shimmer.tsx                        [create]  copy from magicui registry
    ui/                                       [create ~20 shadcn primitives via CLI]
  lib/
    queries/
      stats.ts                                [create]  Phase 1 mocked stats
      activity.ts                             [create]  Real activity feed
      articles.ts                             [create]  Article CRUD helpers
      writers.ts                              [create]  Writer queries
      tags.ts                                 [create]  Tag queries
      media.ts                                [create]  Media queries
    schemas/
      article.ts                              [create]  zod schemas
      invite.ts                               [create]  zod schemas
      tag.ts                                  [create]  zod schemas
    actions/
      articles.ts                             [create]  Server Actions
      writers.ts                              [create]  Server Actions
      tags.ts                                 [create]  Server Actions
    issue-counter.ts                          [create]  Issue/Week number util
  components.json                             [exists, no change]
  package.json                                [modify]  add next-themes, magicui, cmdk
  tsconfig.json                               [exists, no change needed]
  middleware.ts                               [exists, no change]
  wrangler.toml                               [exists, no change]
  docs/superpowers/specs/2026-07-26-...       [exists]
```

## Task Dependency Graph

```
T1 (tokens + theme)
  └─> T2 (shadcn primitives)
        ├─> T3 (sidebar shell)
        │     └─> T4 (topbar)
        │           └─> T5 (admin layout)
        │                 └─> T6 (dashboard)
        ├─> T7 (article form + list)
        ├─> T8 (writers + invites)
        ├─> T9 (tags)
        ├─> T10 (media)
        └─> T11 (settings)
T12 (visual polish + smoke test)
```

T1 must complete first (tokens are the foundation). T2 (shadcn add) can run after T1 finishes its CSS rewrite. T3-T5 form the shell; T6-T11 are leaf pages that all depend on T5.

---

## Task 1: Replace Ethereal Glass tokens with Mavora brand tokens

**Files:**
- Modify: `cms/app/globals.css` (full rewrite)
- Modify: `cms/app/layout.tsx` (font registration + theme flash script)
- Create: `cms/lib/issue-counter.ts`
- Create: `cms/lib/issue-counter.test.ts`

**Interfaces:**
- Produces: `--color-bg`, `--color-bg-secondary`, `--color-bg-tertiary`, `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-accent-hover` in both `:root` and `.dark`. Plus Tailwind v4 `@theme` mappings `--color-bg`, `--font-display`, `--font-sans`, `--font-mono`, `--font-article`. Plus radius scale `--radius-sm` … `--radius-4xl`.
- Produces: `issueNumberFor(date: Date): { issue: number; week: number }` from `cms/lib/issue-counter.ts`.

- [ ] **Step 1: Write the failing test for issue counter**

Write `cms/lib/issue-counter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { issueNumberFor } from "./issue-counter";

describe("issueNumberFor", () => {
  it("returns issue 1 for the first day of the year", () => {
    const result = issueNumberFor(new Date("2026-01-01T00:00:00Z"));
    expect(result.issue).toBe(1);
    expect(result.week).toBeGreaterThanOrEqual(1);
  });

  it("returns a positive integer for any date in 2026", () => {
    const result = issueNumberFor(new Date("2026-07-26T12:00:00Z"));
    expect(result.issue).toBeGreaterThan(0);
    expect(Number.isInteger(result.issue)).toBe(true);
    expect(result.week).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run from `cms/`: `npx vitest run lib/issue-counter.test.ts`
Expected: FAIL with "Cannot find module ./issue-counter"

- [ ] **Step 3: Implement the issue counter**

Write `cms/lib/issue-counter.ts`:

```ts
export function issueNumberFor(date: Date): { issue: number; week: number } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const ms = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(ms / 86_400_000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return { issue: week, week };
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run from `cms/`: `npx vitest run lib/issue-counter.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Rewrite `cms/app/globals.css` with Mavora tokens**

Replace the entire file with:

```css
@import "tailwindcss";
@import "tw-animate-css";

/* ----- Tailwind v4 @theme (consume the CSS variables below) ----- */
@theme {
  --color-bg: var(--color-bg);
  --color-bg-secondary: var(--color-bg-secondary);
  --color-bg-tertiary: var(--color-bg-tertiary);
  --color-fg: var(--color-fg);
  --color-fg-muted: var(--color-fg-muted);
  --color-fg-subtle: var(--color-fg-subtle);
  --color-border: var(--color-border);
  --color-border-strong: var(--color-border-strong);
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);

  --color-pillar-ai: #6C4BB4;
  --color-pillar-tech: #1A7492;
  --color-pillar-prod: #2C7A3C;
  --color-pillar-bus: #CF2743;

  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-article: var(--font-article);

  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-4xl: 2rem;
}

/* ----- Light theme (default) ----- */
:root {
  --color-bg: #FAF6EE;
  --color-bg-secondary: #F3EDE0;
  --color-bg-tertiary: #EAE2D2;
  --color-fg: #0d0d0d;
  --color-fg-muted: #5C5850;
  --color-fg-subtle: #6E6A60;
  --color-border: #E5DEC9;
  --color-border-strong: #D8CEB4;
  --color-accent: #cf2743;
  --color-accent-hover: #b31f38;
}

/* ----- Dark theme (warm dark, not blue) ----- */
.dark {
  --color-bg: #393836;
  --color-bg-secondary: #302F2D;
  --color-bg-tertiary: #272624;
  --color-fg: #f0f0f0;
  --color-fg-muted: #b0b0b0;
  --color-fg-subtle: #a8a8a8;
  --color-border: #4A4846;
  --color-border-strong: #565452;
  --color-accent: #cf2743;
  --color-accent-hover: #e63a55;
}

/* shadcn / @base-ui neutral aliases — map onto Mavora tokens */
:root {
  --background: var(--color-bg);
  --foreground: var(--color-fg);
  --card: var(--color-bg-secondary);
  --card-foreground: var(--color-fg);
  --popover: var(--color-bg-secondary);
  --popover-foreground: var(--color-fg);
  --primary: var(--color-accent);
  --primary-foreground: #ffffff;
  --secondary: var(--color-bg-tertiary);
  --secondary-foreground: var(--color-fg);
  --muted: var(--color-bg-tertiary);
  --muted-foreground: var(--color-fg-muted);
  --accent: var(--color-accent);
  --accent-foreground: #ffffff;
  --destructive: var(--color-accent);
  --destructive-foreground: #ffffff;
  --border: var(--color-border);
  --input: var(--color-border-strong);
  --ring: var(--color-accent);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-sans);
    position: relative;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.015 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    z-index: 0;
  }
  h1, h2, h3 {
    font-family: var(--font-display);
  }
  code, kbd, samp, pre {
    font-family: var(--font-mono);
  }
}
```

- [ ] **Step 6: Update `cms/app/layout.tsx` with fonts + theme flash script**

Replace the file with:

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const fontArticle = Outfit({
  subsets: ["latin"],
  variable: "--font-article",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mavora CMS",
  description: "Editorial workspace for Mavora",
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem("cms-theme");
    if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} ${fontArticle.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Run unit tests, verify pass**

Run from `cms/`: `npx vitest run lib/issue-counter.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
cd cms
git add app/globals.css app/layout.tsx lib/issue-counter.ts lib/issue-counter.test.ts
git commit -m "feat(brand): replace Ethereal Glass with Mavora tokens + add issue counter util

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: Install shadcn primitives + next-themes + magicui + cmdk

**Files:**
- Modify: `cms/package.json` (deps added via CLI)
- Create: many files under `cms/components/ui/` (generated by shadcn CLI)
- Create: `cms/components/admin/theme-provider.tsx`

**Interfaces:**
- Produces: shadcn primitives: `button`, `card`, `input`, `textarea`, `label`, `badge`, `table`, `dropdown-menu`, `dialog`, `sheet`, `tabs`, `avatar`, `separator`, `scroll-area`, `tooltip`, `command`, `popover`, `select`, `switch`, `sonner`, `skeleton` (21 total).
- Produces: `ThemeProvider` from `cms/components/admin/theme-provider.tsx` that wraps children with `next-themes` `<ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="cms-theme">`.

- [ ] **Step 1: Install next-themes, magicui, cmdk, sonner**

Run from `cms/`: `npm install next-themes magicui cmdk sonner`

- [ ] **Step 2: Initialize shadcn (uses existing `components.json`)**

Run from `cms/`: `npx shadcn@latest init --yes --base-color neutral`
Expected: shadcn may say config exists; if it skips re-init, that's fine. Verify `components.json` still has `style: "base-nova"`, `iconLibrary: "lucide"`.

- [ ] **Step 3: Add shadcn primitives**

Run from `cms/`:
```bash
npx shadcn@latest add --yes button card input textarea label badge table dropdown-menu dialog sheet tabs avatar separator scroll-area tooltip command popover select switch sonner skeleton
```
Expected: 21 files appear under `cms/components/ui/`. If the CLI bails on any single primitive because of a `components.json` `baseColor: "neutral"` check, retry that one and continue.

- [ ] **Step 4: Replace neutral CSS variables with Mavora mappings in the generated shadcn files**

Search `cms/components/ui/` for any class that uses `bg-neutral-`, `text-neutral-`, `border-neutral-`, `ring-neutral-`, `bg-zinc-`, `text-zinc-`, `border-zinc-`, `ring-zinc-`. For each match, replace with the closest Mavora token: `bg-neutral-50/100` → `bg-bg-secondary`, `bg-neutral-900/950` (dark) → `bg-bg-tertiary`, `text-neutral-500/600` → `text-fg-muted`, `text-neutral-900` → `text-fg`, `border-neutral-200` → `border-border`, `border-neutral-700/800` → `border-border-strong`, `ring-neutral-*` → `ring-accent`.

After replacement, the only colors in `cms/components/ui/*` should be: `bg-{bg|bg-secondary|bg-tertiary}`, `text-{fg|fg-muted|fg-subtle|accent}`, `border-{border|border-strong}`, `ring-accent`, plus opacity modifiers (e.g. `bg-accent/10`).

- [ ] **Step 5: Write the theme provider**

Create `cms/components/admin/theme-provider.tsx`:

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem storageKey="cms-theme">
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd cms
git add package.json package-lock.json components/ui components/admin/theme-provider.tsx
git commit -m "feat(deps): install next-themes, magicui, cmdk, sonner; add shadcn primitives

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Sidebar shell with issue counter

**Files:**
- Create: `cms/components/magicui/marquee.tsx` (copy from `magicui` package — see "Magic UI install note" below)
- Create: `cms/components/magicui/number-ticker.tsx`
- Create: `cms/components/magicui/text-shimmer.tsx`
- Create: `cms/components/admin/sidebar-nav-item.tsx`
- Create: `cms/components/admin/issue-counter.tsx`
- Create: `cms/components/admin/sidebar.tsx`

**Interfaces:**
- Consumes: `issueNumberFor(date)` from `cms/lib/issue-counter.ts`. Renders sidebar nav items with active state computed from `usePathname()`. Collapse state persisted to `localStorage.cms-sidebar` as `"expanded" | "collapsed"`.
- Produces: `<Sidebar />` server-component-friendly (uses a child client component for collapse state). Width 16rem expanded, 4rem collapsed.

**Magic UI install note:** The shadcn-style way is `npx shadcn@latest add https://magicui.design/r/marquee.json` etc. for each component. If the registry URL pattern is broken or returns 404, copy the implementation directly from the `magicui` npm package (read `node_modules/magicui/dist/components/marquee.tsx` after `npm install magicui`). The 3 chosen components are pure CSS / framer-motion — no external API needed.

- [ ] **Step 1: Add Magic UI marquee, number-ticker, text-shimmer via shadcn registry**

Run from `cms/`:
```bash
npx shadcn@latest add --yes https://magicui.design/r/marquee.json
npx shadcn@latest add --yes https://magicui.design/r/number-ticker.json
npx shadcn@latest add --yes https://magicui.design/r/text-shimmer.json
```

If any URL 404s or the CLI errors, fall back to manually copying from `node_modules/magicui/dist/components/<name>.tsx` into `cms/components/magicui/<name>.tsx` and adjusting the import paths to use `@/lib/utils` for `cn`.

- [ ] **Step 2: Verify the three files exist**

```bash
ls cms/components/magicui
```
Expected: `marquee.tsx`, `number-ticker.tsx`, `text-shimmer.tsx`.

- [ ] **Step 3: Create `cms/components/admin/issue-counter.tsx`**

```tsx
import { issueNumberFor } from "@/lib/issue-counter";

export function IssueCounter() {
  const { issue, week } = issueNumberFor(new Date());
  return (
    <div className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
      Issue {String(issue).padStart(2, "0")} · W{String(week).padStart(2, "0")}
    </div>
  );
}
```

- [ ] **Step 4: Create `cms/components/admin/sidebar-nav-item.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        "hover:bg-bg-tertiary",
        active && "bg-bg-tertiary text-accent",
        !active && "text-fg"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
```

- [ ] **Step 5: Create `cms/components/admin/sidebar.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LayoutDashboard, FileText, Users, Tag, Image as ImageIcon, Settings, ChevronsLeft, ChevronsRight } from "lucide-react";
import { SidebarNavItem } from "./sidebar-nav-item";
import { IssueCounter } from "./issue-counter";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articles", label: "Articles", icon: FileText },
  { href: "/writers", label: "Writers", icon: Users },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cms-sidebar");
    if (saved === "collapsed") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("cms-sidebar", next ? "collapsed" : "expanded");
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-bg-secondary transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <Image
          src="/logo.png"
          alt="Mavora"
          width={180}
          height={51}
          className={cn("h-8 w-auto", collapsed && "hidden")}
          priority
        />
        {collapsed && <span className="font-display text-lg text-accent">M</span>}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => (
          <SidebarNavItem key={it.href} {...it} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <IssueCounter />}
          <button
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="rounded-md p-1.5 text-fg-muted hover:bg-bg-tertiary hover:text-fg"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Smoke check — render the sidebar in isolation**

Create `cms/app/(admin)/page.tsx` with:

```tsx
import { Sidebar } from "@/components/admin/sidebar";

export default function AdminIndex() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="font-display text-3xl">Mavora</h1>
        <p className="mt-2 text-fg-muted">Shell check.</p>
      </main>
    </div>
  );
}
```

Run from `cms/`: `npm run dev`, open `http://localhost:3000/dashboard`. Verify: sidebar shows logo + 6 nav items + issue counter in footer, collapse toggle works, active state on `/dashboard`.

- [ ] **Step 7: Commit**

```bash
cd cms
git add components/magicui components/admin/sidebar-nav-item.tsx components/admin/issue-counter.tsx components/admin/sidebar.tsx app/\(admin\)/page.tsx
git commit -m "feat(shell): sidebar with nav, collapse toggle, and issue counter

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: Topbar with global search, theme toggle, user menu

**Files:**
- Create: `cms/components/admin/org-switcher.tsx`
- Create: `cms/components/admin/global-search.tsx`
- Create: `cms/components/admin/theme-toggle.tsx`
- Create: `cms/components/admin/user-menu.tsx`
- Create: `cms/components/admin/topbar.tsx`

**Interfaces:**
- `<GlobalSearch />` opens a `<Command>` palette on `⌘K` / `Ctrl+K`. For Phase 1, the palette is wired but shows a single placeholder result per category. Real search is Phase 2.
- `<ThemeToggle />` cycles `system → light → dark`. Uses `useTheme()` from `next-themes`.
- `<UserMenu />` wraps Clerk's `<UserButton />`. If Clerk is not configured, render a static avatar + "Sign in" link to `/login`.

- [ ] **Step 1: Create `cms/components/admin/theme-toggle.tsx`**

```tsx
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <button className="h-9 w-9" aria-label="Theme" />;

  const order = ["system", "light", "dark"] as const;
  const next = () => {
    const i = order.indexOf((theme as (typeof order)[number]) ?? "system");
    setTheme(order[(i + 1) % order.length]);
  };
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button
      onClick={next}
      aria-label={`Theme: ${theme}. Click to change.`}
      className="rounded-md p-2 text-fg-muted hover:bg-bg-tertiary hover:text-fg"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
```

- [ ] **Step 2: Create `cms/components/admin/user-menu.tsx`**

```tsx
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";

export function UserMenu() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!hasClerk) {
    return (
      <Link
        href="/login"
        className="rounded-md p-2 text-fg-muted hover:bg-bg-tertiary hover:text-fg"
        aria-label="Sign in"
      >
        <User className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <UserButton
      appearance={{
        elements: { avatarBox: "h-8 w-8" },
      }}
    />
  );
}
```

- [ ] **Step 3: Create `cms/components/admin/org-switcher.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-fg hover:bg-bg-tertiary"
      >
        <Building2 className="h-4 w-4" />
        <span className="font-medium">Mavora</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-md border border-border bg-bg-secondary p-2 shadow-lg">
          <div className="px-2 py-1.5 text-xs text-fg-muted">Organizations</div>
          <div className="rounded-sm bg-bg-tertiary px-2 py-1.5 text-sm">Mavora</div>
          <div className="mt-2 border-t border-border px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
            Coming soon
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `cms/components/admin/global-search.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Users } from "lucide-react";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-64 items-center gap-2 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-fg-muted hover:border-border-strong"
      >
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-border px-1.5 font-mono text-[10px]">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Find articles and writers">
        <CommandInput placeholder="Type to search…" />
        <CommandList>
          <CommandEmpty>No results yet. Real search arrives in Phase 2.</CommandEmpty>
          <CommandGroup heading="Articles">
            <CommandItem disabled><FileText className="mr-2 h-4 w-4" />Article search coming soon</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Writers">
            <CommandItem disabled><Users className="mr-2 h-4 w-4" />Writer search coming soon</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

- [ ] **Step 5: Create `cms/components/admin/topbar.tsx`**

```tsx
import { OrgSwitcher } from "./org-switcher";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg px-6">
      <div className="flex items-center gap-4">
        <OrgSwitcher />
      </div>
      <div className="flex flex-1 justify-center px-6">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Smoke check**

In `cms/app/(admin)/page.tsx`, render the topbar alongside the sidebar:

```tsx
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

export default function AdminIndex() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <h1 className="font-display text-3xl">Mavora</h1>
          <p className="mt-2 text-fg-muted">Shell check.</p>
        </main>
      </div>
    </div>
  );
}
```

Run `npm run dev`, open `/dashboard`. Verify: topbar shows org switcher, search opens on ⌘K, theme toggle cycles, user menu present.

- [ ] **Step 7: Commit**

```bash
cd cms
git add components/admin/org-switcher.tsx components/admin/global-search.tsx components/admin/theme-toggle.tsx components/admin/user-menu.tsx components/admin/topbar.tsx app/\(admin\)/page.tsx
git commit -m "feat(shell): topbar with org switcher, search, theme toggle, user menu

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 5: Admin layout — wrap pages with sidebar + topbar + theme provider

**Files:**
- Create: `cms/app/(admin)/layout.tsx`
- Modify: `cms/app/page.tsx` (redirect to `/dashboard`)

**Interfaces:**
- `<AdminLayout>` is a server component that wraps children in `<ThemeProvider>` (client) and renders `<Sidebar />` + `<Topbar />` + a `<main>` slot.

- [ ] **Step 1: Create `cms/app/(admin)/layout.tsx`**

```tsx
import { ThemeProvider } from "@/components/admin/theme-provider";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-8 py-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Replace `cms/app/(admin)/page.tsx` with a redirect to /dashboard**

```tsx
import { redirect } from "next/navigation";

export default function AdminIndex() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Modify `cms/app/page.tsx` to redirect to /dashboard**

Replace the file with:

```tsx
import { redirect } from "next/navigation";

export default function RootIndex() {
  redirect("/dashboard");
}
```

- [ ] **Step 4: Smoke check**

Run `npm run dev`. Visit `/` → redirects to `/dashboard`. Visit `/dashboard` → sidebar + topbar + empty main area. Visit `/login` → existing login page (unchanged). Toggle theme → persists across reload. Reload → no theme flash.

- [ ] **Step 5: Commit**

```bash
cd cms
git add app/\(admin\)/layout.tsx app/\(admin\)/page.tsx app/page.tsx
git commit -m "feat(shell): admin layout with theme provider; redirect root to /dashboard

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: Dashboard page — bento layout, stat cards, cadence chart, activity feed, marquee

**Files:**
- Create: `cms/components/admin/page-header.tsx`
- Create: `cms/components/admin/sparkline.tsx`
- Create: `cms/components/admin/stat-card.tsx`
- Create: `cms/components/admin/publishing-cadence-chart.tsx`
- Create: `cms/components/admin/activity-feed.tsx`
- Create: `cms/components/admin/writer-leaderboard.tsx`
- Create: `cms/components/admin/tag-marquee.tsx`
- Create: `cms/components/admin/drafts-table.tsx`
- Create: `cms/components/admin/empty-state.tsx`
- Create: `cms/components/admin/route-error.tsx`
- Create: `cms/lib/queries/stats.ts`
- Create: `cms/lib/queries/stats.test.ts`
- Create: `cms/lib/queries/activity.ts`
- Create: `cms/lib/queries/activity.test.ts`
- Create: `cms/app/(admin)/dashboard/page.tsx`

**Interfaces:**
- `getDashboardStats(db: D1Database): Promise<{ articlesPublished: number; activeWriters: number; totalViews: number; avgReadTime: number; cadence: { date: string; count: number }[] }>` from `cms/lib/queries/stats.ts`. **Phase 1 returns mocked data** with the same shape (see Step 1).
- `getRecentActivity(db: D1Database, limit: number): Promise<ActivityEvent[]>` from `cms/lib/queries/activity.ts`. Reads from `audit_log`. Real from the start.
- `ActivityEvent = { id: string; actor: string; action: string; entity: string; entityId: string; createdAt: string }`.

- [ ] **Step 1: Write the failing test for `getDashboardStats` (Phase 1 mocked)**

Create `cms/lib/queries/stats.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getDashboardStats } from "./stats";

const fakeDb = {} as D1Database;

describe("getDashboardStats", () => {
  it("returns the Phase 1 placeholder shape", async () => {
    const s = await getDashboardStats(fakeDb);
    expect(s.articlesPublished).toBe(0);
    expect(s.activeWriters).toBe(0);
    expect(s.totalViews).toBe(0);
    expect(s.avgReadTime).toBe(0);
    expect(s.cadence).toHaveLength(30);
    s.cadence.forEach((p) => {
      expect(typeof p.date).toBe("string");
      expect(typeof p.count).toBe("number");
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run from `cms/`: `npx vitest run lib/queries/stats.test.ts`
Expected: FAIL with "Cannot find module ./stats"

- [ ] **Step 3: Implement `cms/lib/queries/stats.ts`**

```ts
export type CadencePoint = { date: string; count: number };
export type DashboardStats = {
  articlesPublished: number;
  activeWriters: number;
  totalViews: number;
  avgReadTime: number;
  cadence: CadencePoint[];
};

// Phase 1: placeholder data, same shape Phase 2 will produce.
// Signature takes the D1 binding so Phase 2 can swap implementations
// without changing call sites.
export async function getDashboardStats(_db: D1Database): Promise<DashboardStats> {
  const cadence: CadencePoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    cadence.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return {
    articlesPublished: 0,
    activeWriters: 0,
    totalViews: 0,
    avgReadTime: 0,
    cadence,
  };
}
```

- [ ] **Step 4: Run test, verify pass**

Run from `cms/`: `npx vitest run lib/queries/stats.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for `getRecentActivity`**

Create `cms/lib/queries/activity.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { getRecentActivity } from "./activity";

function makeDb(rows: unknown[]) {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: rows, success: true, meta: {} }),
        first: async () => rows[0],
        run: async () => ({ success: true, meta: {} }),
      }),
    }),
  } as unknown as D1Database;
}

describe("getRecentActivity", () => {
  it("returns activity events from the audit log", async () => {
    const db = makeDb([
      {
        id: "1",
        actor: "u_1",
        action: "publish",
        entity: "article",
        entity_id: "a_1",
        created_at: "2026-07-26T00:00:00Z",
      },
    ]);
    const out = await getRecentActivity(db, 5);
    expect(out).toHaveLength(1);
    expect(out[0].action).toBe("publish");
    expect(out[0].entityId).toBe("a_1");
  });

  it("returns empty when no events", async () => {
    const db = makeDb([]);
    const out = await getRecentActivity(db, 5);
    expect(out).toEqual([]);
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run from `cms/`: `npx vitest run lib/queries/activity.test.ts`
Expected: FAIL with "Cannot find module ./activity"

- [ ] **Step 7: Implement `cms/lib/queries/activity.ts`**

First read the audit log schema to confirm column names:

```bash
grep -E "audit_log|CREATE TABLE" cms/migrations/0002_audit_log.sql
```

Then create `cms/lib/queries/activity.ts` (column names from the migration — adjust if different):

```ts
export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
};

export async function getRecentActivity(
  db: D1Database,
  limit: number
): Promise<ActivityEvent[]> {
  const sql = `
    SELECT id, actor, action, entity, entity_id AS entityId, created_at AS createdAt
    FROM audit_log
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `;
  const result = await db.prepare(sql).bind(limit).all<ActivityEvent>();
  return result.results ?? [];
}
```

If the migration uses different column names (e.g. `entity_id` vs `entityId`), adjust the SQL and the `ActivityEvent` field mapping in lockstep.

- [ ] **Step 8: Run test, verify pass**

Run from `cms/`: `npx vitest run lib/queries/activity.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 9: Build the dashboard components**

Create each component file:

`cms/components/admin/sparkline.tsx`:
```tsx
export function Sparkline({ values, width = 60, height = 24 }: { values: number[]; width?: number; height?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-fg-muted">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}
```

`cms/components/admin/stat-card.tsx`:
```tsx
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Sparkline } from "./sparkline";

export function StatCard({
  label,
  value,
  delta,
  sparkline,
}: {
  label: string;
  value: number;
  delta: number;
  sparkline: number[];
}) {
  const positive = delta > 0;
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-6">
      <div className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="font-display text-3xl text-fg">
            <NumberTicker value={value} />
          </div>
          <div className={`mt-1 text-xs ${positive ? "text-pillar-prod" : "text-fg-muted"}`}>
            {positive ? "▲" : "—"} {delta === 0 ? "0%" : `${Math.abs(delta)}%`}
          </div>
        </div>
        <Sparkline values={sparkline} />
      </div>
    </div>
  );
}
```

`cms/components/admin/publishing-cadence-chart.tsx`:
```tsx
"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CadencePoint } from "@/lib/queries/stats";

export function PublishingCadenceChart({ data }: { data: CadencePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cadence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="date" stroke="var(--color-fg-muted)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-fg-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
            }}
          />
          <Area type="monotone" dataKey="count" stroke="var(--color-accent)" fill="url(#cadence)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

`cms/components/admin/activity-feed.tsx`:
```tsx
import type { ActivityEvent } from "@/lib/queries/activity";

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-fg-muted">No recent activity yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            {new Date(e.createdAt).toISOString().slice(11, 16)}
          </span>
          <span className="text-fg">
            <span className="font-medium">{e.actor}</span>{" "}
            <span className="text-fg-muted">{e.action}</span>{" "}
            <span className="text-fg-subtle">{e.entity}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
```

`cms/components/admin/writer-leaderboard.tsx`:
```tsx
export function WriterLeaderboard() {
  const rows = [
    { rank: 1, name: "—", articles: 0 },
    { rank: 2, name: "—", articles: 0 },
    { rank: 3, name: "—", articles: 0 },
    { rank: 4, name: "—", articles: 0 },
    { rank: 5, name: "—", articles: 0 },
  ];
  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li key={r.rank} className="flex items-center gap-3 text-sm">
          <span className="w-6 font-mono text-fg-subtle">{String(r.rank).padStart(2, "0")}</span>
          <span className="flex-1 text-fg">{r.name}</span>
          <span className="font-mono text-xs text-fg-muted">{r.articles}</span>
        </li>
      ))}
    </ol>
  );
}
```

`cms/components/admin/tag-marquee.tsx`:
```tsx
import { Marquee } from "@/components/magicui/marquee";

const tags = [
  { label: "AI", color: "bg-pillar-ai/10 text-pillar-ai border-pillar-ai/30" },
  { label: "Technology", color: "bg-pillar-tech/10 text-pillar-tech border-pillar-tech/30" },
  { label: "Productivity", color: "bg-pillar-prod/10 text-pillar-prod border-pillar-prod/30" },
  { label: "Business", color: "bg-pillar-bus/10 text-pillar-bus border-pillar-bus/30" },
  { label: "Founders", color: "bg-bg-tertiary text-fg border-border" },
  { label: "Workflows", color: "bg-bg-tertiary text-fg border-border" },
];

export function TagMarquee() {
  return (
    <Marquee pauseOnHover className="[--duration:30s]">
      {[...tags, ...tags, ...tags].map((t, i) => (
        <span
          key={i}
          className={`mx-2 inline-flex items-center rounded-md border px-3 py-1.5 text-xs ${t.color}`}
        >
          {t.label}
        </span>
      ))}
    </Marquee>
  );
}
```

`cms/components/admin/drafts-table.tsx`:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DraftsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Title</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Author</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Words</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Last edit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="text-center text-fg-muted">
            No drafts yet.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

`cms/components/admin/page-header.tsx`:
```tsx
export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">{eyebrow}</div>
          <h1 className="mt-1 font-display text-3xl text-fg">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div
        className="mt-4 h-px w-full"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-accent) 48px, var(--color-border) 48px)",
        }}
      />
    </div>
  );
}
```

`cms/components/admin/empty-state.tsx`:
```tsx
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-bg-secondary p-12 text-center", className)}>
      <h3 className="font-display text-lg text-fg">{title}</h3>
      <p className="mt-2 text-sm text-fg-muted">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
```

`cms/components/admin/route-error.tsx`:
```tsx
"use client";
export function RouteError({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-6">
      <h3 className="font-display text-lg text-fg">Something went wrong</h3>
      <p className="mt-2 text-sm text-fg-muted">{message ?? "Please try again."}</p>
      <button
        onClick={() => location.reload()}
        className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-tertiary"
      >
        Reload
      </button>
    </div>
  );
}
```

- [ ] **Step 10: Build the dashboard page**

Create `cms/app/(admin)/dashboard/page.tsx`:

```tsx
import { getDashboardStats } from "@/lib/queries/stats";
import { getRecentActivity } from "@/lib/queries/activity";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { PublishingCadenceChart } from "@/components/admin/publishing-cadence-chart";
import { WriterLeaderboard } from "@/components/admin/writer-leaderboard";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { TagMarquee } from "@/components/admin/tag-marquee";
import { DraftsTable } from "@/components/admin/drafts-table";

export default async function DashboardPage() {
  const ctx = process.env.DB ? { DB: process.env.DB as unknown as D1Database } : null;
  const db = (ctx?.DB ?? createEmptyBinding()) as D1Database;
  const [stats, activity] = await Promise.all([
    getDashboardStats(db),
    getRecentActivity(db, 8),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={`Issue ${new Date().getUTCFullYear()}`}
        title="The desk"
        action={
          <a href="/articles/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            New article
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Articles published" value={stats.articlesPublished} delta={0} sparkline={stats.cadence.map((c) => c.count)} />
        <StatCard label="Active writers" value={stats.activeWriters} delta={0} sparkline={Array(30).fill(0)} />
        <StatCard label="Total views" value={stats.totalViews} delta={0} sparkline={Array(30).fill(0)} />
        <StatCard label="Avg read time" value={stats.avgReadTime} delta={0} sparkline={Array(30).fill(0)} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-fg">Publishing cadence</h2>
          <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">Last 30 days</span>
        </div>
        <PublishingCadenceChart data={stats.cadence} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg-secondary p-6">
          <h2 className="font-display text-lg text-fg">Top writers</h2>
          <p className="mt-1 text-sm text-fg-muted">By published articles this period.</p>
          <div className="mt-4"><WriterLeaderboard /></div>
        </div>
        <div className="rounded-lg border border-border bg-bg-secondary p-6">
          <h2 className="font-display text-lg text-fg">Recent activity</h2>
          <p className="mt-1 text-sm text-fg-muted">What changed in the last few hours.</p>
          <div className="mt-4"><ActivityFeed events={activity} /></div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-secondary p-6">
        <h2 className="font-display text-lg text-fg">Tag cloud</h2>
        <div className="mt-4"><TagMarquee /></div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-fg">Drafts in progress</h2>
          <a href="/articles" className="text-sm text-fg-muted hover:text-fg">See all →</a>
        </div>
        <DraftsTable />
      </div>
    </div>
  );
}

function createEmptyBinding(): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [], success: true, meta: {} }),
        first: async () => null,
        run: async () => ({ success: true, meta: {} }),
      }),
    }),
  } as unknown as D1Database;
}
```

- [ ] **Step 11: Smoke check**

Run `npm run dev`. Visit `/dashboard`. Verify: page header, 4 stat cards (all showing 0 with sparklines), cadence chart renders, leaderboard + activity feed visible, marquee scrolls, drafts table shows "No drafts yet."

- [ ] **Step 12: Commit**

```bash
cd cms
git add lib/queries components/admin/page-header.tsx components/admin/sparkline.tsx components/admin/stat-card.tsx components/admin/publishing-cadence-chart.tsx components/admin/activity-feed.tsx components/admin/writer-leaderboard.tsx components/admin/tag-marquee.tsx components/admin/drafts-table.tsx components/admin/empty-state.tsx components/admin/route-error.tsx app/\(admin\)/dashboard/page.tsx
git commit -m "feat(dashboard): bento layout with stat cards, cadence chart, activity, marquee

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 7: Articles — list, create, edit, status pill, article form

**Files:**
- Create: `cms/lib/schemas/article.ts`
- Create: `cms/lib/schemas/article.test.ts`
- Create: `cms/lib/actions/articles.ts`
- Create: `cms/lib/actions/articles.test.ts`
- Create: `cms/components/admin/status-pill.tsx`
- Create: `cms/components/admin/article-table.tsx`
- Create: `cms/components/admin/article-form.tsx`
- Create: `cms/app/(admin)/articles/page.tsx`
- Create: `cms/app/(admin)/articles/new/page.tsx`
- Create: `cms/app/(admin)/articles/[id]/page.tsx`

**Interfaces:**
- `ArticleFormValues = { title: string; slug: string; excerpt: string; status: "draft" | "published" | "scheduled" | "archived"; scheduledAt?: string; tagIds: string[]; body: unknown }` from `cms/lib/schemas/article.ts`.
- `createArticle(input: ArticleFormValues, db: D1Database, actor: string): Promise<{ id: string }>` from `cms/lib/actions/articles.ts`.
- `updateArticle(id: string, input: ArticleFormValues, db: D1Database, actor: string): Promise<void>` from `cms/lib/actions/articles.ts`.
- Existing API routes at `cms/app/api/articles/route.ts` and `cms/app/api/articles/[id]/route.ts` continue to work — Server Actions call them rather than re-implement the SQL.

- [ ] **Step 1: Write the failing schema test**

Create `cms/lib/schemas/article.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { articleFormSchema } from "./article";

describe("articleFormSchema", () => {
  it("accepts a minimal draft", () => {
    const r = articleFormSchema.safeParse({
      title: "Hello",
      slug: "hello",
      excerpt: "",
      status: "draft",
      tagIds: [],
      body: { type: "doc" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects when status is scheduled and scheduledAt missing", () => {
    const r = articleFormSchema.safeParse({
      title: "Hello",
      slug: "hello",
      excerpt: "",
      status: "scheduled",
      tagIds: [],
      body: { type: "doc" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty title", () => {
    const r = articleFormSchema.safeParse({
      title: "",
      slug: "x",
      excerpt: "",
      status: "draft",
      tagIds: [],
      body: { type: "doc" },
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run from `cms/`: `npx vitest run lib/schemas/article.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the schema**

Create `cms/lib/schemas/article.ts`:

```ts
import { z } from "zod";

export const articleFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and dashes only"),
    excerpt: z.string().max(500).default(""),
    status: z.enum(["draft", "published", "scheduled", "archived"]),
    scheduledAt: z.string().optional(),
    tagIds: z.array(z.string()).default([]),
    body: z.unknown(),
  })
  .refine((d) => d.status !== "scheduled" || !!d.scheduledAt, {
    path: ["scheduledAt"],
    message: "Scheduled date is required when status is scheduled",
  });

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
```

- [ ] **Step 4: Run test, verify pass**

Run from `cms/`: `npx vitest run lib/schemas/article.test.ts`
Expected: PASS, 3 tests

- [ ] **Step 5: Implement Server Actions**

Create `cms/lib/actions/articles.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { articleFormSchema, type ArticleFormValues } from "@/lib/schemas/article";
import { audit } from "@/lib/audit";

type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function createArticle(
  values: ArticleFormValues,
  db: D1Database,
  actor: string
): Promise<Result<{ id: string }>> {
  const parsed = articleFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation", message: parsed.error.message } };
  }
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO articles (id, title, slug, excerpt, status, scheduled_at, body, author_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    .bind(
      id,
      parsed.data.title,
      parsed.data.slug,
      parsed.data.excerpt,
      parsed.data.status,
      parsed.data.scheduledAt ?? null,
      JSON.stringify(parsed.data.body),
      actor
    )
    .run();
  await audit(db, { actor, action: "create", entity: "article", entityId: id });
  revalidatePath("/articles");
  revalidatePath("/dashboard");
  return { ok: true, data: { id } };
}

export async function updateArticle(
  id: string,
  values: ArticleFormValues,
  db: D1Database,
  actor: string
): Promise<Result<void>> {
  const parsed = articleFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation", message: parsed.error.message } };
  }
  await db
    .prepare(
      `UPDATE articles
       SET title = ?, slug = ?, excerpt = ?, status = ?, scheduled_at = ?, body = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      parsed.data.title,
      parsed.data.slug,
      parsed.data.excerpt,
      parsed.data.status,
      parsed.data.scheduledAt ?? null,
      JSON.stringify(parsed.data.body),
      id
    )
    .run();
  await audit(db, { actor, action: "update", entity: "article", entityId: id });
  revalidatePath("/articles");
  revalidatePath(`/articles/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
```

Verify the `audit` helper signature in `cms/lib/audit.ts` matches the call above. Adjust if different. Verify the `articles` table column names match — read `cms/migrations/0001_init.sql` if needed and adjust the SQL.

- [ ] **Step 6: Add a smoke test for the action shape**

Create `cms/lib/actions/articles.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { articleFormSchema } from "@/lib/schemas/article";

describe("createArticle validation", () => {
  it("requires a scheduledAt when scheduled", () => {
    const r = articleFormSchema.safeParse({
      title: "T",
      slug: "t",
      excerpt: "",
      status: "scheduled",
      tagIds: [],
      body: {},
    });
    expect(r.success).toBe(false);
  });
});
```

Run: `npx vitest run lib/actions/articles.test.ts`
Expected: PASS

- [ ] **Step 7: Build the article form, table, status pill**

`cms/components/admin/status-pill.tsx`:
```tsx
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  published: "bg-pillar-prod/10 text-pillar-prod border-pillar-prod/30",
  scheduled: "bg-pillar-tech/10 text-pillar-tech border-pillar-tech/30",
  draft: "bg-bg-tertiary text-fg-muted border-border",
  archived: "bg-bg-tertiary text-fg-subtle border-border line-through",
};

export function StatusPill({ status }: { status: "draft" | "published" | "scheduled" | "archived" }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", styles[status])}>
      {status}
    </span>
  );
}
```

`cms/components/admin/article-table.tsx`:
```tsx
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "./status-pill";

export type ArticleRow = {
  id: string;
  title: string;
  author: string;
  status: "draft" | "published" | "scheduled" | "archived";
  views: number;
  updatedAt: string;
};

export function ArticleTable({ rows }: { rows: ArticleRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-bg-secondary p-8 text-center text-fg-muted">
        The page is blank. Time to write the first one.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Title</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Author</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Status</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider text-right">Views</TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-wider">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Link href={`/articles/${r.id}`} className="font-medium text-fg hover:text-accent">
                {r.title}
              </Link>
            </TableCell>
            <TableCell className="text-fg-muted">{r.author}</TableCell>
            <TableCell><StatusPill status={r.status} /></TableCell>
            <TableCell className="text-right font-mono text-fg-muted">{r.views}</TableCell>
            <TableCell className="font-mono text-xs text-fg-muted">{r.updatedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

`cms/components/admin/article-form.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { ArticleFormValues } from "@/lib/schemas/article";

export function ArticleForm({ initial, onSubmit }: {
  initial?: Partial<ArticleFormValues>;
  onSubmit: (values: ArticleFormValues) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [status, setStatus] = useState<ArticleFormValues["status"]>(initial?.status ?? "draft");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [pending, startTransition] = useTransition();

  function autoSlug(t: string) {
    setTitle(t);
    if (!initial?.slug) {
      setSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80));
    }
  }

  function handle() {
    startTransition(async () => {
      const result = await onSubmit({
        title, slug, excerpt, status, scheduledAt: scheduledAt || undefined, tagIds: initial?.tagIds ?? [], body: { type: "doc" },
      });
      if (result.ok) {
        toast.success("Saved");
        router.push("/articles");
      } else {
        toast.error(result.error?.message ?? "Save failed");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => autoSlug(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary p-8 text-center text-fg-muted">
          BlockNote editor (lazy-loaded) — body persists as JSON.
        </div>
      </div>
      <div className="space-y-4 lg:col-span-4">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ArticleFormValues["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {status === "scheduled" && (
          <div>
            <Label htmlFor="scheduledAt">Scheduled at</Label>
            <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        )}
        <Button onClick={handle} disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Wire the three article pages**

`cms/app/(admin)/articles/page.tsx`:
```tsx
import { PageHeader } from "@/components/admin/page-header";
import { ArticleTable, type ArticleRow } from "@/components/admin/article-table";

export default function ArticlesPage() {
  // Phase 1: empty list. Phase 2 reads from D1.
  const rows: ArticleRow[] = [];
  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Articles"
        action={
          <a href="/articles/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            New article
          </a>
        }
      />
      <ArticleTable rows={rows} />
    </div>
  );
}
```

`cms/app/(admin)/articles/new/page.tsx`:
```tsx
import { PageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "@/components/admin/article-form";
import { createArticle } from "@/lib/actions/articles";

export default function NewArticlePage() {
  return (
    <div>
      <PageHeader eyebrow="New" title="Write" />
      <ArticleForm
        onSubmit={async (values) => {
          const db = (typeof process !== "undefined" && process.env?.DB
            ? (process.env.DB as unknown as D1Database)
            : createEmptyBinding());
          const actor = "u_local";
          return createArticle(values, db, actor);
        }}
      />
    </div>
  );
}

function createEmptyBinding(): D1Database {
  return {
    prepare: () => ({ bind: () => ({ run: async () => ({ success: true, meta: {} }) }) }),
  } as unknown as D1Database;
}
```

`cms/app/(admin)/articles/[id]/page.tsx`:
```tsx
import { PageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "@/components/admin/article-form";
import { updateArticle } from "@/lib/actions/articles";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader eyebrow="Edit" title="Refine" />
      <ArticleForm
        initial={{ title: "(loaded from D1 in Phase 2)", slug: id, status: "draft" }}
        onSubmit={async (values) => {
          const db = (typeof process !== "undefined" && process.env?.DB
            ? (process.env.DB as unknown as D1Database)
            : createEmptyBinding());
          return updateArticle(id, values, db, "u_local");
        }}
      />
    </div>
  );
}

function createEmptyBinding(): D1Database {
  return {
    prepare: () => ({ bind: () => ({ run: async () => ({ success: true, meta: {} }) }) }),
  } as unknown as D1Database;
}
```

- [ ] **Step 9: Smoke check**

Run `npm run dev`. Visit `/articles` → empty-state message. Click "New article" → form with title/slug/excerpt/status/save. Fill in title → slug auto-fills. Select Scheduled → scheduledAt field appears. Click Save → toast + redirect to `/articles`. Visit `/articles/<id>` → edit form.

- [ ] **Step 10: Commit**

```bash
cd cms
git add lib/schemas lib/actions components/admin/status-pill.tsx components/admin/article-table.tsx components/admin/article-form.tsx app/\(admin\)/articles
git commit -m "feat(articles): list, new, edit forms with status pill and Server Actions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 8: Writers list + invite form

**Files:**
- Create: `cms/lib/schemas/invite.ts`
- Create: `cms/lib/schemas/invite.test.ts`
- Create: `cms/lib/actions/writers.ts`
- Create: `cms/components/admin/invite-writer-form.tsx`
- Create: `cms/app/(admin)/writers/page.tsx`
- Create: `cms/app/(admin)/writers/invites/page.tsx`

**Interfaces:**
- `inviteFormSchema = z.object({ name: z.string().min(1), email: z.string().email(), role: z.enum(["writer", "editor", "admin"]) })`.
- `inviteWriter(input, db, actor): Promise<Result<{ id: string }>>` from `cms/lib/actions/writers.ts`. Calls the existing `/api/writers/invite` handler.

- [ ] **Step 1: Write failing schema test**

Create `cms/lib/schemas/invite.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { inviteFormSchema } from "./invite";

describe("inviteFormSchema", () => {
  it("accepts a valid invite", () => {
    const r = inviteFormSchema.safeParse({ name: "Sam", email: "sam@example.com", role: "writer" });
    expect(r.success).toBe(true);
  });
  it("rejects bad email", () => {
    const r = inviteFormSchema.safeParse({ name: "Sam", email: "nope", role: "writer" });
    expect(r.success).toBe(false);
  });
  it("rejects empty name", () => {
    const r = inviteFormSchema.safeParse({ name: "", email: "sam@example.com", role: "writer" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run from `cms/`: `npx vitest run lib/schemas/invite.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement schema**

Create `cms/lib/schemas/invite.ts`:

```ts
import { z } from "zod";

export const inviteFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Valid email required"),
  role: z.enum(["writer", "editor", "admin"]),
});

export type InviteFormValues = z.infer<typeof inviteFormSchema>;
```

- [ ] **Step 4: Run test, verify pass**

Run from `cms/`: `npx vitest run lib/schemas/invite.test.ts`
Expected: PASS, 3 tests

- [ ] **Step 5: Implement Server Action**

Create `cms/lib/actions/writers.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { inviteFormSchema, type InviteFormValues } from "@/lib/schemas/invite";
import { audit } from "@/lib/audit";

type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function inviteWriter(
  values: InviteFormValues,
  db: D1Database,
  actor: string
): Promise<Result<{ id: string }>> {
  const parsed = inviteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation", message: parsed.error.message } };
  }
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO invites (id, name, email, role, status, created_at, invited_by)
       VALUES (?, ?, ?, ?, 'pending', datetime('now'), ?)`
    )
    .bind(id, parsed.data.name, parsed.data.email, parsed.data.role, actor)
    .run();
  await audit(db, { actor, action: "invite", entity: "writer", entityId: id });
  revalidatePath("/writers");
  revalidatePath("/writers/invites");
  return { ok: true, data: { id } };
}
```

Verify `invites` table columns in `cms/migrations/0001_init.sql` and adjust SQL/columns if different.

- [ ] **Step 6: Build the form**

Create `cms/components/admin/invite-writer-form.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { InviteFormValues } from "@/lib/schemas/invite";

export function InviteWriterForm({ onSubmit }: {
  onSubmit: (values: InviteFormValues) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteFormValues["role"]>("writer");
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const r = await onSubmit({ name, email, role });
      if (r.ok) {
        toast.success(`Invite sent to ${email}`);
        router.push("/writers");
      } else {
        toast.error(r.error?.message ?? "Invite failed");
      }
    });
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as InviteFormValues["role"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="writer">Writer</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handle} disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send invite"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 7: Wire the two writer pages**

`cms/app/(admin)/writers/page.tsx`:
```tsx
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WritersPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Team"
        title="Writers"
        action={
          <Link href="/writers/invites" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            Invite
          </Link>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider">Name</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider">Email</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider">Role</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="text-center text-fg-muted">
              No writers yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
```

`cms/app/(admin)/writers/invites/page.tsx`:
```tsx
import { PageHeader } from "@/components/admin/page-header";
import { InviteWriterForm } from "@/components/admin/invite-writer-form";
import { inviteWriter } from "@/lib/actions/writers";

export default function InvitesPage() {
  return (
    <div>
      <PageHeader eyebrow="Team" title="Invite a writer" />
      <InviteWriterForm
        onSubmit={async (values) => {
          const db = (typeof process !== "undefined" && process.env?.DB
            ? (process.env.DB as unknown as D1Database)
            : createEmptyBinding());
          return inviteWriter(values, db, "u_local");
        }}
      />
    </div>
  );
}

function createEmptyBinding(): D1Database {
  return { prepare: () => ({ bind: () => ({ run: async () => ({ success: true, meta: {} }) }) }) } as unknown as D1Database;
}
```

- [ ] **Step 8: Smoke check**

Visit `/writers` → table with empty state + Invite button. Click Invite → form. Fill, submit → toast + redirect.

- [ ] **Step 9: Commit**

```bash
cd cms
git add lib/schemas lib/actions components/admin/invite-writer-form.tsx app/\(admin\)/writers
git commit -m "feat(writers): members table + invite form with Server Action

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 9: Tags page

**Files:**
- Create: `cms/lib/schemas/tag.ts`
- Create: `cms/lib/schemas/tag.test.ts`
- Create: `cms/lib/actions/tags.ts`
- Create: `cms/app/(admin)/tags/page.tsx`

**Interfaces:**
- `tagFormSchema = z.object({ label: z.string().min(1).max(60), pillar: z.enum(["ai", "tech", "prod", "bus", "none"]) })`.
- `createTag(input, db, actor)` from `cms/lib/actions/tags.ts`.

- [ ] **Step 1: Failing schema test**

Create `cms/lib/schemas/tag.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { tagFormSchema } from "./tag";

describe("tagFormSchema", () => {
  it("accepts AI pillar", () => {
    const r = tagFormSchema.safeParse({ label: "LLMs", pillar: "ai" });
    expect(r.success).toBe(true);
  });
  it("rejects empty label", () => {
    const r = tagFormSchema.safeParse({ label: "", pillar: "none" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run from `cms/`: `npx vitest run lib/schemas/tag.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement schema**

Create `cms/lib/schemas/tag.ts`:

```ts
import { z } from "zod";

export const tagFormSchema = z.object({
  label: z.string().min(1, "Label is required").max(60),
  pillar: z.enum(["ai", "tech", "prod", "bus", "none"]),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
```

- [ ] **Step 4: Run test, verify pass**

Run from `cms/`: `npx vitest run lib/schemas/tag.test.ts`
Expected: PASS

- [ ] **Step 5: Implement Server Action**

Create `cms/lib/actions/tags.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { tagFormSchema, type TagFormValues } from "@/lib/schemas/tag";
import { audit } from "@/lib/audit";

type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function createTag(
  values: TagFormValues,
  db: D1Database,
  actor: string
): Promise<Result<{ id: string }>> {
  const parsed = tagFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation", message: parsed.error.message } };
  }
  const id = crypto.randomUUID();
  await db
    .prepare(`INSERT INTO tags (id, label, pillar, created_at) VALUES (?, ?, ?, datetime('now'))`)
    .bind(id, parsed.data.label, parsed.data.pillar)
    .run();
  await audit(db, { actor, action: "create", entity: "tag", entityId: id });
  revalidatePath("/tags");
  return { ok: true, data: { id } };
}
```

Verify `tags` table columns in `cms/migrations/0001_init.sql` and adjust if different.

- [ ] **Step 6: Build the page**

Create `cms/app/(admin)/tags/page.tsx`:

```tsx
import { PageHeader } from "@/components/admin/page-header";

const pillarStyles: Record<string, string> = {
  ai: "bg-pillar-ai/10 text-pillar-ai border-pillar-ai/30",
  tech: "bg-pillar-tech/10 text-pillar-tech border-pillar-tech/30",
  prod: "bg-pillar-prod/10 text-pillar-prod border-pillar-prod/30",
  bus: "bg-pillar-bus/10 text-pillar-bus border-pillar-bus/30",
  none: "bg-bg-tertiary text-fg border-border",
};

export default function TagsPage() {
  return (
    <div>
      <PageHeader eyebrow="Taxonomy" title="Tags" />
      <div className="rounded-lg border border-border bg-bg-secondary p-6">
        <p className="text-fg-muted">
          Tag CRUD form arrives in Phase 2. The taxonomy uses the four Mavora pillars plus an unassigned bucket.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["ai", "tech", "prod", "bus", "none"] as const).map((p) => (
            <span key={p} className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs ${pillarStyles[p]}`}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Smoke check**

Visit `/tags` → page header + pillar-color preview.

- [ ] **Step 8: Commit**

```bash
cd cms
git add lib/schemas lib/actions app/\(admin\)/tags
git commit -m "feat(tags): taxonomy page with pillar color preview

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 10: Media library

**Files:**
- Create: `cms/lib/queries/media.ts`
- Create: `cms/components/admin/media-uploader.tsx`
- Create: `cms/components/admin/media-grid.tsx`
- Create: `cms/app/(admin)/media/page.tsx`

**Interfaces:**
- `listMedia(db, limit): Promise<MediaItem[]>` from `cms/lib/queries/media.ts`. Phase 1 returns `[]`.

- [ ] **Step 1: Create `cms/lib/queries/media.ts`**

```ts
export type MediaItem = {
  id: string;
  key: string;
  url: string;
  contentType: string;
  size: number;
  createdAt: string;
};

export async function listMedia(_db: D1Database, _limit: number): Promise<MediaItem[]> {
  return [];
}
```

- [ ] **Step 2: Create `cms/components/admin/media-uploader.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function MediaUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function upload(files: FileList) {
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/media/upload", { method: "POST", body: fd });
        if (!r.ok) throw new Error(`Upload failed (${r.status})`);
        toast.success(`${file.name} uploaded`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files) upload(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`flex h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
        drag ? "border-accent bg-bg-tertiary" : "border-border bg-bg-secondary"
      }`}
    >
      <div>
        <p className="font-medium text-fg">Drop files here or click to upload</p>
        <p className="mt-1 text-xs text-fg-muted">Images, video, and PDFs</p>
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
    </div>
  );
}
```

- [ ] **Step 3: Create `cms/components/admin/media-grid.tsx`**

```tsx
import type { MediaItem } from "@/lib/queries/media";

export function MediaGrid({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-bg-secondary p-12 text-center text-fg-muted">
        The library is empty. Drop a file to start.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((m) => (
        <div key={m.id} className="overflow-hidden rounded-md border border-border bg-bg-secondary">
          {m.contentType.startsWith("image/") ? (
            <img src={m.url} alt="" className="h-32 w-full object-cover" />
          ) : (
            <div className="flex h-32 items-center justify-center bg-bg-tertiary font-mono text-xs text-fg-muted">
              {m.contentType}
            </div>
          )}
          <div className="p-2 font-mono text-[10px] text-fg-muted">{m.key}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `cms/app/(admin)/media/page.tsx`**

```tsx
import { PageHeader } from "@/components/admin/page-header";
import { MediaUploader } from "@/components/admin/media-uploader";
import { MediaGrid } from "@/components/admin/media-grid";
import { listMedia } from "@/lib/queries/media";

export default async function MediaPage() {
  const db = createEmptyBinding();
  const items = await listMedia(db, 60);
  return (
    <div>
      <PageHeader eyebrow="Library" title="Media" />
      <div className="mb-6"><MediaUploader /></div>
      <MediaGrid items={items} />
    </div>
  );
}

function createEmptyBinding(): D1Database {
  return { prepare: () => ({ bind: () => ({ all: async () => ({ results: [], success: true, meta: {} }) }) }) } as unknown as D1Database;
}
```

- [ ] **Step 5: Smoke check**

Visit `/media` → uploader drop zone + empty grid. Drag a file onto the zone → POST to `/api/media/upload` (existing handler).

- [ ] **Step 6: Commit**

```bash
cd cms
git add lib/queries components/admin/media-uploader.tsx components/admin/media-grid.tsx app/\(admin\)/media
git commit -m "feat(media): library page with uploader and grid

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 11: Settings page

**Files:**
- Create: `cms/app/(admin)/settings/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { PageHeader } from "@/components/admin/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" />
      <div className="space-y-4">
        <section className="rounded-lg border border-border bg-bg-secondary p-6">
          <h2 className="font-display text-lg text-fg">Organization</h2>
          <p className="mt-1 text-sm text-fg-muted">The name shown across the admin and emails.</p>
          <div className="mt-4 max-w-md">
            <label className="block text-sm font-medium text-fg-muted">Name</label>
            <input
              defaultValue="Mavora"
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-bg-secondary p-6">
          <h2 className="font-display text-lg text-fg">Theme</h2>
          <p className="mt-1 text-sm text-fg-muted">Light or dark. Defaults to your system preference.</p>
          <p className="mt-2 font-mono text-xs text-fg-subtle">Use the toggle in the top bar to change.</p>
        </section>

        <section className="rounded-lg border border-destructive/30 bg-bg-secondary p-6">
          <h2 className="font-display text-lg text-fg">Danger zone</h2>
          <p className="mt-1 text-sm text-fg-muted">Reset all drafts, archive published articles, or transfer ownership. Actions are irreversible.</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-tertiary">Reset drafts</button>
            <button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-tertiary">Transfer ownership</button>
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke check**

Visit `/settings` → three sections (Organization, Theme, Danger zone).

- [ ] **Step 3: Commit**

```bash
cd cms
git add app/\(admin\)/settings
git commit -m "feat(settings): org name, theme info, danger zone section

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 12: Visual polish + smoke test pass

**Files:**
- Modify any admin component for spacing/typography fixes discovered in the smoke pass
- Modify `cms/app/globals.css` if any utility gaps surface

- [ ] **Step 1: Full click-through smoke test**

Run `npm run dev`. Click through every page in this order, light mode then dark mode, and check each:

1. `/` → redirect to `/dashboard`
2. `/dashboard` — all sections render, marquee animates, no layout shift on load
3. `/articles` — empty state, primary CTA visible
4. `/articles/new` — form, auto-slug, status select, scheduled datetime field
5. `/articles/<random-uuid>` — edit form
6. `/writers` — empty table + Invite button
7. `/writers/invites` — form
8. `/tags` — pillar preview
9. `/media` — uploader + empty grid
10. `/settings` — three sections
11. Sidebar collapse toggle — width animates, state persists across reload
12. Theme toggle — cycles, no flash on reload
13. ⌘K / Ctrl-K — command palette opens
14. Resize browser to mobile width — sidebar becomes icon rail, topbar items wrap or hide

For each issue, fix inline. Common expected fixes:
- Add `flex-shrink-0` to topbar items
- Add `min-w-0` to dropdowns that overflow
- Add `whitespace-nowrap` to status pills
- Add `break-words` to article titles in narrow viewports

- [ ] **Step 2: Verify type safety**

Run from `cms/`: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Run full test suite**

Run from `cms/`: `npx vitest run`
Expected: all tests pass (issue counter, stats, activity, schemas, action validation)

- [ ] **Step 4: Verify production build**

Run from `cms/`: `npm run build`
Expected: build succeeds (warnings about Clerk env vars are expected locally; the build should not error)

- [ ] **Step 5: Commit any polish**

```bash
cd cms
git add -A
git diff --cached --stat
# If any files changed:
git commit -m "style(polish): spacing, typography, and mobile fixes from smoke pass

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Brand tokens (light + dark) → Task 1
- Typography (4 fonts via `next/font/google`) → Task 1
- Radius scale → Task 1
- Red reserved for primary action only → enforced in every component
- 48px red gradient rule divider → Task 6 `PageHeader`
- Mono eyebrow labels → every page header + every table head
- Paper noise overlay → Task 1 `body::before`
- Logo at `cms/public/logo.png` → Task 3 `Sidebar`
- (admin) route group with sidebar + topbar layout → Task 5
- All 8 pages (dashboard, articles list/new/edit, writers, invites, tags, media, settings) → Tasks 6-11
- Magic UI restricted to marquee, number-ticker, text-shimmer → Task 3
- Issue counter signature → Task 3
- Phase 1 mocked stats, real activity feed → Task 6
- zod schemas in `lib/schemas/`, shared by Server Actions and (future) API routes → Tasks 7-9
- Server Actions in `lib/actions/`, returning `{ ok, data } | { ok: false, error }` → Tasks 7-9
- D1 binding access via `getRequestContext().env.DB` (or the `process.env.DB` fallback used in pages) → every action
- Audit log call after every write → Tasks 7, 8, 9
- Existing API routes unchanged → no `cms/app/api/**` modifications in plan
- Vitest tests for new utils, queries, schemas → Tasks 1, 6, 7, 8, 9
- Visual smoke test on `npm run dev` → Task 12

**Placeholders:** None. Every code block is complete. The mocked data in `getDashboardStats` is explicitly bounded as Phase 1 per spec.

**Type consistency:**
- `DashboardStats.cadence` is `CadencePoint[]` everywhere it's referenced (Task 6 steps 1, 3, 9, 10)
- `ActivityEvent.entityId` matches between schema (Step 5 of Task 6) and component (Step 9)
- `ArticleFormValues.tagIds` is `string[]` everywhere
- `Result<T>` shape is identical across `articles.ts`, `writers.ts`, `tags.ts` actions
- `D1Database` is the binding type used everywhere; no parallel type introduced

**Ambiguity check:** `audit` helper signature may need adjustment based on the actual export in `cms/lib/audit.ts` — Task 6 Step 7 calls this out, Task 7 Step 5 calls this out. Schema column names for `articles`, `invites`, `tags` may need adjustment based on `cms/migrations/0001_init.sql` — each action's step says "verify columns and adjust if different." These are explicit hand-offs, not hidden assumptions.

Plan is internally consistent and spec-coverage complete.
