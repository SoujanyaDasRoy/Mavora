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
