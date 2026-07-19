# Mavora Public Frontend — Design Spec

## Overview

The public site (homepage, category pages, article pages, static pages, search) is fully built and functional but completely unstyled — still the raw `create-next-app` scaffold CSS from Task 1 of the original build. This spec covers the visual/interaction layer: a modern, clean, animated design built on the reference layout the user provided, using Tailwind CSS and GSAP.

## Goals

- Ship the reference image's structure (hero "Top Story", sidebar, featured grid, latest grid) using Mavora's actual 4 content pillars, not the reference's placeholder categories
- Light + dark theme with a toggle, red accent, consistent across every page
- GSAP-driven animation as a first-class part of the design, not an afterthought — scroll reveals, hover states, respecting `prefers-reduced-motion`
- Modern, clean, "attractive" UI — generous whitespace, confident typography, no templated-default feel
- Client-side search (no backend, static export compatible)
- Zero changes to `lib/content.ts`, the content schema, or any existing route logic — this is a pure presentation-layer pass over already-working pages

## Out of Scope

- Any backend/data-layer changes (content loading, SEO plumbing, forms — all already built and working)
- The `YouTubeEmbed`/`TwitterEmbed` components needed for CMS-published embeds (flagged separately, tracked as its own follow-up, not blocking this pass — an article using an embed is an edge case until real content exists)
- CMS app styling (`cms/` is a separate, internal-only app; out of scope here)

## Visual Identity

- **Wordmark**: "MAVORA", bold sans-serif, uppercase, letter-spaced
- **Accent color**: `#DC2626` (red-600) — used for the wordmark, active nav state, category eyebrows, links on hover, and key CTAs. Same accent in both themes.
- **Light theme**: background `#FFFFFF`, text `#171717`, secondary text `#525252`, borders `#E5E5E5`
- **Dark theme**: background `#0A0A0A`, text `#EDEDED`, secondary text `#A3A3A3`, borders `#262626`
- Implemented as CSS custom properties on `:root`/`:root.dark`, consumed by Tailwind via `dark:` variant (class-based strategy, not media-query-only, since there's a manual toggle)
- **Typography**: Inter (via `next/font/google`) for body and UI text; headlines use the same family at heavier weight (700/800) and tighter tracking — no second display font, keeps it clean rather than "busy"
- **Layout**: centered container, `max-width: 1280px`, consistent gutter (`px-6` mobile, `px-8` desktop)

## Theme Toggle

- `ThemeToggle` client component in the header: sun/moon icon, cycles light → dark
- On first load: read `localStorage`, fall back to `prefers-color-scheme`, fall back to light
- Persists choice to `localStorage`, applies via a `dark` class on `<html>` (set before paint via a small inline script in `layout.tsx` to avoid a flash of wrong theme)

## Site Structure & Pages

### Header (all pages)
Wordmark (left) · nav: Home, AI, Technology, Productivity, Business (center/right) · search icon → `/search` · theme toggle · mobile hamburger collapsing nav into a slide-down panel

### Footer (all pages)
Restyled version of the existing `NewsletterSignup` component + link list (About, Contact, Privacy, Terms, Affiliate Disclosure, Editorial Standards) + copyright line

### Homepage (`/`)
1. **Hero "Top Story"** — most recent post across all pillars: large cover image, pillar eyebrow, headline, dek (description), byline placeholder + date
2. **Sidebar** (desktop: right column beside hero; mobile: stacks below) — "Latest News" (next 4 most recent posts, compact thumbnail+headline+date) and "Categories" (4 pillars with live post counts, linking to pillar pages)
3. **Featured** — 3-column grid, next 3 posts after the hero/sidebar set
4. **Latest Articles** — 2-column grid, reverse-chronological across all pillars, all remaining posts

### Category pages (`/[pillar]`)
Pillar title + description, grid of `ArticleCard`s (grid variant) for that pillar only, reverse-chronological

### Article pages (`/[pillar]/[slug]`)
Center-constrained reading column (`max-width: 720px` for body text — wider hero image above it), cover image as a full-bleed-ish hero under the header, pillar eyebrow + title + byline/date, then the MDX body with real typographic styling (headings, links, lists, blockquotes, code, tables — `@tailwindcss/typography` as the base, customized to match the theme)

### Static pages (About, Contact, Privacy, Terms, Affiliate Disclosure, Editorial Standards)
Not covered by the reference image — simple, consistent centered-column typography treatment (same reading-column width as articles), page title, MDX/plain content. Contact page keeps the existing `ContactForm`, restyled to match.

### Search page (`/search`)
Search input, live-filters a client-side index. Index: a static JSON built at build time from `getAllPosts()` (title, description, pillar, slug, publishedAt) — generated via a small build-time script, fetched once on page load, filtered in-browser with no network calls after that. Results render as compact `ArticleCard`s (compact variant).

## Components

- **`ArticleCard`** — one component, `variant: 'hero' | 'grid' | 'compact'` prop, avoids 4 duplicated card markups across hero/featured/latest/search/category
- **`Header`**, **`Footer`**
- **`CategoryList`** — sidebar categories + counts
- **`ThemeToggle`**
- **`SearchBox`** / search page — filters the static index client-side
- **`GsapReveal`** (or direct GSAP hooks per section) — wraps a section, fades/slides it in on scroll into view via `ScrollTrigger`

## Animation (GSAP)

- **Scroll reveals**: sections (hero, featured grid, latest grid, sidebar blocks) fade + slide up ~20px as they enter the viewport, staggered slightly for grids (each card offset ~60ms from the last)
- **Hover states**: article card image scales slightly (~1.03x) on hover, title color transitions to the accent color — CSS transitions are enough for these, GSAP reserved for scroll-driven and entrance animations where CSS alone can't do staggering/viewport-triggering cleanly
- **Theme toggle**: a brief icon transition (rotate/fade between sun and moon), not a full-page animation
- **Reduced motion**: every GSAP animation checks `window.matchMedia('(prefers-reduced-motion: reduce)')` and skips straight to the final state (no animation) when true — this is a hard requirement, not optional polish
- **Performance**: GSAP + ScrollTrigger loaded only where used (client components), animations use `transform`/`opacity` only (no layout-triggering properties), so they stay cheap and don't hurt Core Web Vitals

## Testing

- No new backend/data-layer logic in this pass, so no new D1/API-style test suite. The search-index build script (real logic: `getAllPosts()` → JSON) gets a unit test.
- Everything else is presentational: verified via `npm run build` (already-established pattern from the original build) + manual browser check where possible.
- `prefers-reduced-motion` handling gets a targeted check (mock the media query, confirm animations skip).

## Explicitly Deferred

- `YouTubeEmbed`/`TwitterEmbed` components for CMS-published embeds (separate, small follow-up)
- Related-posts on article pages
- Any analytics-driven "trending" sorting
