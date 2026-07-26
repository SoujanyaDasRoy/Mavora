# Mavora CMS — Editor Refresh Plan

## Context

Two asks bundled:

1. **Font swap** — Outfit for headings/display, Inter for body, JetBrains Mono for code.
2. **Replace the editor stub** — `components/block-editor.tsx` currently renders BlockNote JSON as raw text in a `<textarea>`. No slash menu, no toolbar, no drag/drop. The three `@blocknote/*` packages are already installed (0.51.4); only the integration is missing.

Scope decided with the user: full plan, all four phases (BlockNote editor → editor chrome → publish handoff → polish).

## Phase 0 — Font swap (small, do first)

`app/layout.tsx:8` binds `--font-display` to `Space_Grotesk`. Line 23 imports `Outfit` already and binds it to `--font-article`, which is referenced nowhere in the codebase. Net change:

- Replace `Space_Grotesk` import with `Outfit`.
- Drop the `fontArticle` import + binding (unused).
- Rebind `--font-display` to Outfit. Body sans stays Inter (`--font-sans`), mono stays JetBrains (`--font-mono`).
- Add `subsets: ['latin']`, `display: 'swap'`, `weight: ['400', '500', '600', '700']` to Outfit so bold weights work for headings.
- Verify no hardcoded `'Space Grotesk'` or `font-display` overrides elsewhere by grepping `--font-display` references.

Files: `app/layout.tsx` only. Pure CSS-variable swap, zero ripple.

## Phase 1 — Real BlockNote

Goal: replace `components/block-editor.tsx` stub with a real BlockNote editor, preserving the `initialContent`/`onChange`/`getArticleId` API that `app/(admin)/articles/new/page.tsx` and `[id]/page.tsx` already consume. Also re-export `components/BlockEditor.tsx` (legacy re-export shim from earlier work) to keep working.

### 1.1 Editor component

File: `components/block-editor.tsx` (overwrite).

```tsx
'use client'
import { useEffect, useMemo, useRef } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { filterSuggestionItems } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
```

Constructor:

- `useCreateBlockNote({ initialContent: parseInitial(initialContent), uploaders })`
- `initialContent` accepts `PartialBlock[] | undefined`. Today's contract is "string of JSON" — parse with a `try/catch` so a malformed blob falls back to `[ { type: 'paragraph', content: [] } ]` rather than crashing the editor.
- The editor's `onChange` callback emits a `Block[]` array — serialize via `JSON.stringify(editor.document)` to keep the existing PATCH contract that writes `blocknote_content` as JSON text.

Custom blocks: extend the schema with `youtubeEmbed` and `twitterEmbed` (validated allowlist matches `lib/mdx-convert.ts` — YouTube + Twitter hostnames only, http/https only). BlockNote ships `<media>` and `<image>` blocks already; no custom code for those.

Uploader config: the editor's `uploadFile` prop is wired to `lib/media-client.ts:uploadMediaFile`. That already posts to `/api/media/upload`. No new server route needed.

Theme: BlockNote's `theme` prop takes `'light' | 'dark'`. Bridge it to our 3-way system by reading `useTheme().resolvedTheme` (which is `'light' | 'dark'` since `dark-oled` collapses to `dark` from next-themes' perspective).

### 1.2 Re-export shim

File: `components/BlockEditor.tsx` (overwrite). Keep this for any other consumer still importing the legacy path:

```tsx
export { BlockEditor } from './block-editor'
```

Both `app/(admin)/articles/new/page.tsx:16` and `[id]/page.tsx:19` already use `dynamic(() => import('@/components/BlockEditor')...)` — no page edits needed.

### 1.3 Strip dev warnings

The stub file has the comment "BlockNote JSON — replace with rich editor in a follow-up." Remove that banner from both the editor component and the page-level captions on `new/page.tsx:181` ("Content Editor" header) and `[id]/page.tsx:208`.

## Phase 2 — Editor chrome (Notion/Substack feel)

Goal: the editor pages stop looking like an admin form and start looking like a writing tool.

### 2.1 Refactor `app/(admin)/articles/[id]/page.tsx`

Move the tabs out of a top-tab strip and into a left-rail layout (Notion-style). Content tab is the main column (full width minus 280px rail), SEO + Publish become side panels. Renders:

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back   |   Big borderless title (Outfit 36px)             │
│           |   pillar pill   •   status pill   •   saved 2s    │
│           |                                       [Publish ▼]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Cover image — full width, optional, click to upload]       │
│                                                              │
│  [BlockNote editor, fills remaining height]                  │
│                                                              │
│                                                              │
│                              ┌─ Rail ─────────────┐          │
│                              │ SEO                │          │
│                              │ ├ Title            │          │
│                              │ ├ Description      │          │
│                              │ Publish            │          │
│                              │ ├ Cover image      │          │
│                              │ └ [Publish btn]    │          │
│                              └────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

- Title field: replace the `<h1>` text + locked state with a borderless `<input>` styled like Notion's title (`text-4xl font-bold`, transparent until focus, placeholder "Untitled"). PATCHes on blur.
- Pillar pill: becomes a `<select>` rendered as a colored pill (uses existing `--color-pillar-{ai,tech,prod,bus}` from `globals.css:26-29`).
- Cover image: full-bleed above the editor. Click-to-replace, drop-to-replace (drop handler on the cover area only). Existing `uploadMediaFile` flow.
- Save status pill: top-right. Tracks `idle | saving | saved`. "Saved 2s ago" with a fade.
- Left rail: 280px sticky, separates Content/SEO/Publish. Right-side clickable cards (not tabs).
- Publish button: bottom of rail, accent color, with a "Published · live since {date}" footer below.

### 2.2 Refactor `app/(admin)/articles/new/page.tsx`

Same layout but for the create flow. Title field is a big borderless input ("Untitled draft"). Pillar select as colored pill. Cover image area. Editor below. Once `articleId` exists, the rail collapses into "Continue editing" link OR a `<Link href="/articles/{id}">` redirect button.

The existing `createDraftIfNeeded` ref-based race handling stays intact — that's load-bearing for the title-blur / editor-keystroke / cover-upload collision case.

### 2.3 Inline image upload (revisit)

Out of scope unless user wants it. BlockNote's `<image>` block already accepts `url` only. Adding drop-into-editor upload means intercepting the `editor.insertBlocks` flow with a custom image block that has an `upload` prop. **Park for now** — cover image handles 95% of the upload need, inline is a stretch goal.

## Phase 3 — Publish handoff

### 3.1 Confirm modal

When the user clicks Publish from the rail, open a `<Dialog>` (shadcn base-ui `Dialog`):

- Title: "Publish to live?"
- Body: cover thumbnail + title + slug preview (`/ai/my-article-2026/`)
- Two buttons: Cancel (secondary) + Publish (accent, `ShinyButton`)
- On confirm: `POST /api/articles/[id]/publish`, close on success, show inline "Live · triggered Git deploy" toast (replaces the current top-bar `Live · Git deploy triggered` text).
- On error: stay open, show error in modal body.

### 3.2 Already-published state

Once `article.status === 'published'`:
- Publish button changes to "Update Live Article" + shows the `publishedAt` timestamp.
- Add a small "Unpublish" ghost button that calls a new `POST /api/articles/[id]/unpublish` route (sets `status='draft'`, deletes the MDX file via `commitContentFile`'s sibling `deleteContentFile`, which already exists in `lib/github.ts:51`).

### 3.3 New route: `POST /api/articles/[id]/unpublish`

Mirror the publish route. Same role guard. Sets `articles.status='draft'`, `published_at=null`. Calls `lib/github.ts:deleteContentFile('content/posts/<pillar>/<slug>.mdx', ...)` which already exists. Records audit event.

## Phase 4 — Polish

### 4.1 Keyboard shortcuts

`⌘B` bold, `⌘I` italic, `⌘K` link, `⌘S` force-save (already covered by autosave; shortcut just suppresses the debounce). Implement via `useEffect` listening on `keydown` while editor is mounted. BlockNote itself binds some of these on the editable surface; only add for ⌘S (no native binding).

### 4.2 Empty-state hint

First block insertion: a fade-in overlay reading "Press `/` for blocks, or just start typing" anchored to the editor's first line. Fades out after first non-empty block is detected via `editor.document.length > 1` or any block having non-empty `content`.

### 4.3 Footer stats

Bottom of editor: live word count + reading time (200 wpm). Use `editor.document.flatMap(b => b.content).filter(c => c.type === 'text').reduce(...)`. Reading time = `Math.ceil(words / 200)`. Render in `text-xs text-[var(--color-fg-subtle)]`.

### 4.4 Stale-write detection

When the page mounts, fetch `?ts=${article.updatedAt}`. The API returns 409 if the DB's `updated_at` is newer than what the client thinks (signaling someone else wrote since this session opened). Show a thin top banner: "Article was updated from another session — reload to see latest?" with a Reload button.

Server side: extend `PATCH /api/articles/[id]` to accept an `ifUpdatedAt` body field and return 409 if `article.updated_at > ifUpdatedAt`. The check is best-effort — if two writers concurrently type into the same doc, last-write-wins still applies; the banner just surfaces the conflict.

## Reuse (no rebuild)

- `lib/mdx-convert.ts` — already validates YouTube/Twitter embeds. BlockNote custom blocks emit JSON in the same shape the existing converter accepts.
- `lib/github.ts` — `commitContentFile` + `deleteContentFile` already exist; unpublish reuses the delete path.
- `lib/media-client.ts` — `uploadMediaFile`, `getPublicMediaUrl`. Editor `uploadFile` prop wires to it.
- `lib/audit.ts` — `recordAuditEvent` already called from publish route; unpublish route mirrors.
- `lib/frontmatter.ts` — frontmatter shape is locked. BlockNote JSON → MDX conversion is unchanged.
- `components/ui/*` — `MagicCard`, `Badge`, `Button`, `Dialog` (base-ui), `ShinyButton`, `ShimmerButton`, `ShineBorder`. All already in `components/ui/`.
- `app/globals.css` — `--color-pillar-{ai,tech,prod,bus}` already defined. Pillar pills reuse.

## Out of scope

- Real-time multi-writer collab (Y.js/Liveblocks — separate feature, real cost).
- Inline image upload during typing (Phase 2.3 parked).
- Comments / suggestions / review mode.
- Mobile editing (BlockNote is desktop-first).
- Tag management UI (frontmatter `tags: []` stays hardcoded empty for now).

## Critical files

- `app/layout.tsx` — font swap (Phase 0).
- `components/block-editor.tsx` — overwrite (Phase 1).
- `components/BlockEditor.tsx` — overwrite to re-export (Phase 1).
- `app/(admin)/articles/new/page.tsx` — layout refactor (Phase 2).
- `app/(admin)/articles/[id]/page.tsx` — layout refactor (Phase 2).
- `app/api/articles/[id]/unpublish/route.ts` — new route (Phase 3).
- `app/api/articles/[id]/route.ts` — extend `PATCH` to honor `ifUpdatedAt` (Phase 4).

## Verification

1. `npm run cf:build` succeeds (Phase 0 alone should already pass; Phase 1+ need Mantine CSS imports to compile).
2. `npm test` — no new failures (158/160 baseline expected to hold or improve).
3. Manual: log in as admin → click "+ New Article" → title field has Outfit at 36px bold → type `/` → slash menu appears with all standard blocks + the 2 custom embeds → typing autosaves → status pill flips to "Saved 2s ago" → cover image drop zone renders → cover upload works → publish modal preview shows the public-site slug.
4. Theme swap: cycle light → dark → OLED. Editor palette follows. Slash menu contrast OK in OLED (this is where BlockNote's hardcoded white backgrounds might need overrides via Mantine CSS vars — verify).
5. Publish: click Publish → modal preview → confirm → MDX appears in `SoujanyaDasRoy/Mavora/content/posts/<pillar>/<slug>.mdx` within 5s → public site redeploys (or already has if Vercel auto-deploy on push).
6. Unpublish: on a published article, click Unpublish → MDX file removed from repo → public site rebuilds without that article.