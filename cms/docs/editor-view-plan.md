# Mavora CMS — Article Editor View Plan

## Context

User wants the article editor (`/articles/new` and `/articles/[id]`) to feel like Notion/Substack: big borderless title, cover image upload, rich-text editor (real BlockNote, not the current JSON-textarea stub), SEO keywords field, and a working publish button — all in one cohesive writing view.

Three `@blocknote/*` packages are already installed (0.51.4) — only the integration is missing. `components/block-editor.tsx` is a stub rendering raw BlockNote JSON in a `<textarea>`. Today the editor page has 3 tabs (Content / SEO / Publish); we're collapsing them into one writing view with a sticky rail.

## Critical files to modify

- `components/block-editor.tsx` — overwrite the stub with real BlockNote.
- `components/BlockEditor.tsx` — overwrite to re-export from `block-editor.tsx`.
- `app/(admin)/articles/new/page.tsx` — collapse the create flow into one writing view.
- `app/(admin)/articles/[id]/page.tsx` — collapse the 3-tab layout into one view.

No new API routes needed. No new server code. The `PATCH /api/articles/[id]`, `POST /api/articles/[id]/publish`, and `POST /api/media/upload` routes already exist and do exactly what we need.

## Layout (both pages, same shape)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Articles           [Pillar pill]   [Status pill]   [Save] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Big borderless title input — Outfit 36px, placeholder]    │
│                                                              │
│  [Cover image — full-bleed, click/drop to upload]            │
│                                                              │
│  ┌────────────────────────────────────┐  ┌─── Rail ────┐    │
│  │                                    │  │ SEO         │    │
│  │   BlockNote rich-text editor       │  │ Title       │    │
│  │   (slash menu, toolbar, embeds)    │  │ Description │    │
│  │                                    │  │ Keywords    │    │
│  │                                    │  │             │    │
│  │                                    │  │ Publish     │    │
│  │                                    │  │ [Publish]   │    │
│  └────────────────────────────────────┘  └─────────────┘    │
│                                                              │
│  Footer: 1,247 words · 6 min read · Saved 2s ago             │
└──────────────────────────────────────────────────────────────┘
```

## Phase 1 — Real BlockNote (`components/block-editor.tsx`)

Overwrite the stub. API contract stays the same (`initialContent: string`, `onChange?: (json: string) => void`, `getArticleId?: () => Promise<string>`) so the existing pages don't need to be rewritten at the API level.

```tsx
'use client'
import { useTheme } from '@/components/theme-provider'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { filterSuggestionItems, type PartialBlock } from '@blocknote/core'
import { customBlocks } from './editor-custom-blocks'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
```

Key bits:
- `useCreateBlockNote({ initialContent: parseInitial(initialContent) })` — `PartialBlock[]`; parse with try/catch fallback to one empty paragraph.
- Custom blocks: `youtubeEmbed`, `twitterEmbed` (validate hostnames — same allowlist as `lib/mdx-convert.ts:29-33`). BlockNote ships `<media>` and `<image>` blocks already.
- `theme` prop bound to `useTheme().resolvedTheme` (light/dark — `dark-oled` collapses to `dark`).
- `onChange` calls `JSON.stringify(editor.document)` to keep the existing JSON-string contract the PATCH route expects.

File: `components/editor-custom-blocks.tsx` (new) — the two custom embed block specs. They produce the same JSON shape the existing `blockNoteToMdx` consumes.

File: `components/BlockEditor.tsx` (overwrite) — `export { BlockEditor } from './block-editor'` so the existing `dynamic(() => import('@/components/BlockEditor')...)` imports keep resolving.

## Phase 2 — Writing view layout (`app/(admin)/articles/[id]/page.tsx`)

Replace the top-tab strip + tab-conditional renders with a single layout:

- **Top bar** (sticky): back link → `/articles`, pillar pill (color-coded using `--color-pillar-{ai,tech,prod,bus}` from `globals.css:26-29`), status pill (Draft/Published + timestamp), save-state pill (idle / saving / saved Ns ago).
- **Title**: borderless `<input>`, `text-4xl font-bold`, font-display (Outfit). PATCH on blur. Placeholder "Untitled".
- **Cover image area**: full-bleed. Empty = dashed border + upload prompt. Hover = "Replace" overlay. Click anywhere opens the file picker. Existing `uploadMediaFile` flow (`lib/media-client.ts`).
- **Editor column**: BlockNote in a `MagicCard`, takes the main width (`flex-1`).
- **Right rail** (sticky, 280px):
  - **SEO section**: title (defaults to article title), description (textarea + char counter /160), keywords (new field — comma-separated string → stored in `seo_keywords`, since frontmatter `tags: []` is currently hardcoded empty).
  - **Publish section**: cover image already set above; Publish button (accent, calls existing `POST /api/articles/[id]/publish`). When `status === 'published'`, button text → "Update Live Article" + shows `publishedAt` below.

Files: `app/(admin)/articles/[id]/page.tsx` overwrite.

## Phase 3 — New-article flow (`app/(admin)/articles/new/page.tsx`)

Same layout as Phase 2, but the article id is created lazily (existing `createDraftIfNeeded` ref pattern stays — it's load-bearing for the title-blur / editor-keystroke / cover-upload race).

- Title input → onBlur triggers draft creation.
- Pillar pill → onChange triggers draft creation.
- Cover upload → triggers draft creation.
- Editor onChange → triggers draft creation + autosaves.

Once `articleId` exists, top bar gains a "Continue editing" button → `/articles/{id}` (since `/articles/new` is transient until first content, this is just a router.push).

Files: `app/(admin)/articles/new/page.tsx` overwrite.

## Phase 4 — SEO keywords field

Frontmatter today: `tags: []` hardcoded in `lib/frontmatter.ts:30`. Need to plumb a real tags string through:

- `articles` table — `seo_keywords TEXT` column (new). Migration: `migrations/0003_seo_keywords.sql` adding the column.
- `lib/articles.ts` — add `seoKeywords: string | null` to `Article` interface, `rowToArticle`, `updateArticle` patch type.
- `app/api/articles/[id]/route.ts` — PATCH accepts `seoKeywords`. GET returns it.
- `lib/frontmatter.ts` — emit `tags: ["kw1", "kw2", ...]` (JSON-encoded array as a YAML flow sequence). Parsed back from comma-separated input on the client.
- `lib/mdx-convert.ts` — unchanged, doesn't touch tags.

## Reuse (no rebuild)

- `lib/mdx-convert.ts` — already validates YouTube/Twitter embeds. Custom BlockNote blocks emit JSON in the same shape it consumes.
- `lib/github.ts` — `commitContentFile` for publish flow, unchanged.
- `lib/media-client.ts` — `uploadMediaFile`, `getPublicMediaUrl`. Editor `uploadFile` and cover upload both call it.
- `lib/frontmatter.ts` — extend to emit real `tags` from `seoKeywords`.
- `app/globals.css` — `--color-pillar-*` and `--font-display` already defined.
- `app/api/articles/[id]/publish/route.ts` — unchanged. Frontmatter build picks up new keywords automatically.
- `app/api/media/upload/route.ts` — unchanged.

## Out of scope

- Font swap (already planned separately, not part of this work).
- Custom block schema changes for inline image upload.
- Multi-tab navigation patterns / mobile breakpoints.
- Unpublish route (publish handoff only).
- Stale-write detection between sessions.
- Keyboard shortcuts (basic BlockNote defaults apply).

## Verification

1. `npm run cf:build` succeeds. BlockNote's Mantine CSS imports compile, no missing exports.
2. `npm test` — no new failures. Existing 158/160 baseline holds.
3. Manual:
   - Log in as admin → `/articles/new` → big Outfit title input (placeholder "Untitled") → type "Hello" → blur → draft created (verify in D1) → router auto-redirects to `/articles/<id>`.
   - At `/articles/<id>` → cover image area visible → drop an image → uploads → preview renders → public URL persisted to `articles.cover_image`.
   - Editor: type `/` → slash menu appears with paragraph / heading / list / quote / table / image / **YouTube Embed** / **Twitter Embed**. Insert YouTube Embed → URL field validates against allowlist → block renders inline.
   - SEO rail: fill title (or leave blank → falls back to article title), description (char counter red over 160), keywords (comma-separated). Blur each → PATCH fires → D1 updated.
   - Click Publish → `POST /api/articles/[id]/publish` → 200 → MDX appears in `SoujanyaDasRoy/Mavora/content/posts/<pillar>/<slug>.mdx` with the new tags frontmatter field.
4. Theme cycle: switch to OLED → editor palette follows.
5. As a writer (non-admin): same flows work on own articles; cannot publish someone else's.