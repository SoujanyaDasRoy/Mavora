# Minimal and Reader-Friendly Search UI Implementation

- [x] Update `components/SearchBox.tsx` to render as a simple floating dropdown anchored absolute below the header's search input.
- [x] Display a "Browse by Topic" section (horizontal list of buttons for the pillars: AI, Technology, Productivity, Business) and "Trending/Featured Stories" (the first 3 stories from the index) when the search input is empty.
- [x] Show the category badge, title, and the reading time metadata (e.g., "5 min read") for each suggestion.
- [x] Implement query-based text highlighting: wrap matched characters (case-insensitive) of the search query inside the matching titles in `<strong class="font-bold text-[var(--color-accent)]">`.
- [x] Remove keyboard navigation helper texts and scroll sliders from the UI to make it extremely clean.
- [x] Update `components/Header.tsx` to:
  - [x] Remove the `Ctrl+K`/`Cmd+K` keyboard shortcut listener and the `⌘K` badge.
  - [x] Make the search trigger button expand inline into a clean text input inside the header, hiding/overlapping menu items smoothly.
  - [x] Show the floating `SearchBox` dropdown below the input when open.
- [x] Verify compiling and execution (all unit tests passed successfully)

## Verge-style Full-screen Search Takeover Overlay Implementation

- [x] Update `components/SearchBox.tsx` to render as a full-screen takeover overlay when `isOpen` is true.
- [x] Lock background scrolling on `document.body` when overlay is open.
- [x] Design top layout with giant search input and a close button.
- [x] Auto-focus search input on mount/open.
- [x] Design split-grid body layout with query results on left and topic pills/trending stories on right.
- [x] Add premium animations (fade-in, slide-up).
- [x] Revert inline expanding input in `components/Header.tsx` and conditionally render `<SearchBox>`.
- [x] Verify compiling and code correctness.

## Redesigned Top Story and Featured Sections

- [x] Redesign the **Top Story** component to be a large cinematic full-width card overlaying the image.
  - [x] Background image occupies the full background (`absolute inset-0 w-full h-full object-cover`).
  - [x] Overlay text (pillar tag in Mavora red, title in bold white text, description, and publish date) is placed at the bottom over a dark gradient overlay (`bg-gradient-to-t from-black/95 via-black/40 to-transparent`).
- [x] Redesign the **Featured** section to be a vertical feed of horizontal row cards:
  - [x] Layout: Stacked vertically using a flex container (`flex flex-col gap-5`).
  - [x] Card structure: Flex container with a square thumbnail on the left (`aspect-square w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover shrink-0`) and text content on the right.
  - [x] Metadata: Display author name in bold uppercase **Mavora Red** (`text-[var(--color-accent)]`) and a comment icon (`MessageSquare` from `lucide-react`) next to a mock comment count.
- [x] Verify that the code compiles cleanly and there are no TypeScript errors.

## UI/UX Fixes

- [x] Create `components/ReadingProgressBar.tsx` as a 'use client' component that tracks scroll position and renders a top fixed reading progress bar of h-[3px] in var(--color-accent).
- [x] Update `components/ArticleCard.tsx` to refactor the unstyled `PillarBadge` component. It should use Tailwind classNames for semantic coloring based on the pillar type (similar to SearchBox.tsx).
- [x] Update `components/SearchBox.tsx` inline wrapper background to `bg-[var(--color-bg-secondary)]` for better UI contrast.
- [x] Update `app/[pillar]/[slug]/page.tsx`:
  - [x] Import and render `<ReadingProgressBar />` inside the article page.
  - [x] Fetch up to 2 other articles in the same pillar (excluding current) and render them at the bottom under a "Read Next" heading inside a `grid sm:grid-cols-2 gap-6` using `ArticleCard` with variant="grid".
- [x] Verify that the code compiles cleanly and there are no TypeScript errors.

## Landing Page Improvements

- [x] Brand Manifesto Strip: Render a styled banner at the top of the Home Page featuring "⚡ KNOWLEDGE FOR THE AMBITIOUS · AI · TECHNOLOGY · PRODUCTIVITY · BUSINESS" with an accent/5 background.
- [x] Redesign Top Story Hero: Increase heights, scale up title typography, and add a backdrop-blur "Read Article →" CTA pill overlay.
- [x] Asymmetric Featured Grid layout: Update index 0 to a landscape 2-column card with larger text and `aspect-[16/9]`, and set the remaining 3 posts as 1-column `aspect-square` cards.
- [x] Modernize Sidebar Categories: Replace list layout with wrapped, rounded topic pills.
- [x] Update Newsletter CTA: Add "Join 4,200+ Knowledge Seekers" social proof headline, a 3-column benefits block (AI, SaaS, productivity), and an updated trust tagline.
- [x] Verify compiling and execution.

## Clean Homepage Layout and Interactive Category-Filtering Feed

- [x] Create `components/InteractiveArticleFeed.tsx` as a client component to handle dynamic topic filtering (All, AI, Technology, Productivity, Business).
- [x] Render featured section for "All Topics" as a 3-column asymmetric grid (first post wide, other two square) followed by Latest Articles.
- [x] Render category-specific posts in a clean 2-column grid layout with SectionLabel.
- [x] Update `app/page.tsx` to remove the brand manifesto strip.
- [x] Slice posts: hero (1st item), latestNews sidebar (3 items), and feedPosts (rest of posts) passed to the interactive feed.
- [x] Remove the redundant Category list widget from the sidebar to keep layout spacing clean.
- [x] Update `task.md` to track completed tasks.
- [x] Verify project compilation and type-safety.

## Landing Page Redesign

- [x] Swap out the font token `--font-article` to `"Playfair Display", Georgia, serif` in `app/globals.css`.
- [x] Redesign category switcher tabs in `components/InteractiveArticleFeed.tsx` to clean, editorial underline tabs and remove wrap button border boxes.
- [x] Remove redundant SectionLabel renders ("Featured", "Latest Articles", etc.) inside the feed in `components/InteractiveArticleFeed.tsx`.
- [x] Remove box borders for article lists/cards, using spacing/dividers.
- [x] Update hover states for article titles to Mavora Red (`hover:text-[var(--color-accent)]`) in `components/InteractiveArticleFeed.tsx`.
- [x] Change sidebar latest news items title hover color to `hover:text-[var(--color-accent)]` in `app/page.tsx`.
- [x] Simplify newsletter section by removing the 3-column benefits block in `app/page.tsx`.
- [x] Verify compilation and update checklist.

## Homepage Layout Modifications and Visual Styling Updates

- [x] Update `app/layout.tsx` to replace `Fraunces` with `Playfair_Display` and inject film-grain overlay div in `<body>`.
- [x] Update `app/page.tsx` to add the trending tags row immediately above the main content grid.
- [x] Update `app/page.tsx` to wrap sidebar widgets inside `<div className="flex flex-col gap-12">` and remove all `<Separator>` elements inside the sidebar column.
- [x] Remove the sidebar newsletter subscription card widget.
- [x] Add a numbered "Popular Stories" widget in the sidebar (displaying 3 popular posts sliced from the `posts` index with ranking tags: `01`, `02`, `03` using a muted monospace font).
- [x] Add reading time metadata (e.g. `• 4 min read`) next to the dates in the sidebar news/stories lists.
- [x] Verify compilation of the project runs successfully without any warnings or errors.

## Search Feature Redesign and Bug Fixes

- [x] Update `app/search/page.tsx` to accept `searchParams` as a Promise, await it, and pass it as `query` prop into `<SearchBox>`.
- [x] Consolidate result-item rendering inside `components/SearchBox.tsx` to reduce duplicated markup.
- [x] Initialize `internalQuery` state with the `query` prop using a `useEffect` in `components/SearchBox.tsx`.
- [x] Consolidate badge styles in `components/SearchBox.tsx` to render all categories with standard accent styling.
- [x] Replace spinning loader with 3 simple pulsing visual skeleton loader cards matching the result shape.
- [x] Update overlay right discovery panel to replace static "Trending Stories" with category pills displaying total counts.
- [x] Remove redundant eyebrow labels and adjust overlay input text size to `text-2xl md:text-3xl font-bold` for clean visual balance and responsiveness.
- [x] Verify compilation of the project runs successfully without any warnings or errors.

## Featured Section 3-column Layout

- [x] Locate the Featured Section layout block in `components/InteractiveArticleFeed.tsx`.
- [x] Change the grid class from `grid grid-cols-2 md:grid-cols-4 gap-6` to a uniform `grid grid-cols-1 md:grid-cols-3 gap-8`.
- [x] Remove the conditional `col-span` on the article element to make all articles have uniform width.
- [x] Set a uniform aspect ratio of `aspect-[3/2]` on all featured card image containers.
- [x] Unify heading text size to `text-[1.05rem] sm:text-[1.15rem]`.
- [x] Update `task.md` to check off completed tasks.
- [x] Verify compilation of the project runs successfully without any warnings or errors.

## Refine Category-Specific Pillar Layouts

- [x] Locate the specific pillar rendering block (inside the `else` condition of `activeTab === 'all'`) in `components/InteractiveArticleFeed.tsx`.
- [x] Remove the redundant category tag rendering: Remove `<PillarTag pillar={post.pillar} />` or make its rendering conditional on `activeTab === 'all'`.
- [x] Change the image container aspect ratio from `aspect-[16/9]` to a uniform `aspect-[3/2]`.
- [x] Run `npm run build` to verify compilation completes successfully with no warnings.
- [x] Update `task.md` to check off completed tasks.

## Latest Articles Single-Column Editorial Row Layout Redesign

- [x] Locate the Latest Articles section inside the `activeTab === 'all'` block in `components/InteractiveArticleFeed.tsx`.
- [x] Change the layout from a 2-column grid to a vertical flex container layout.
- [x] Redesign the article content hierarchy inside each row: set image wrapper with responsive size & 3:2 landscape ratio, flex-1 text wrapper, above-title metadata, font-bold custom h3 leading, and clean description line clamp.
- [x] Remove the old `<PillarTag>` rendering and duplicate `<DateLabel>` at the bottom of the card content.
- [x] Run `npm run build` to verify compilation completes successfully with no warnings.
- [x] Update `task.md` to check off completed tasks.

## Inline Expanding Header Search Bar with Floating Popover Redesign

- [x] Set up client-side states `searchOpen` and `searchQuery` in `components/Header.tsx`.
- [x] When `searchOpen` is true, render a beautiful search input bar in the center of the header container (occupying the space of the navigation menu items on desktop or covering the center on mobile).
- [x] Embed `<SearchBox>` absolute directly below the search input container so it floats under the header.
- [x] Convert `SearchBox` into a floating dropdown popover.
- [x] Remove duplicate search input code, search icon, and close button from inside `SearchBox.tsx`.
- [x] Use the `query` prop passed from `Header.tsx` as the search term.
- [x] Implement click-outside detection to collapse the search.
- [x] Remove background body overflow-hidden toggle.
- [x] Verify Next.js compilation succeeds with no warnings or errors.


