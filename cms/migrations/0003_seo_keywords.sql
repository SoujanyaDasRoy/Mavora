-- Adds seo_keywords to articles. Stored as a comma-separated string rather
-- than a normalized junction table: the public site's frontmatter emits
-- `tags: [...]` as a YAML flow sequence, and the editor UI uses a single
-- comma-separated input. A relational table would add complexity (cross-
-- table migrations, JOIN on every list query) for the benefit of keyword-
-- level queries we don't actually run. If that ever changes, a migration
-- to a `article_tags` table + a CSV normalization step is straightforward.
ALTER TABLE articles ADD COLUMN seo_keywords TEXT;
