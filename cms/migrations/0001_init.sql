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
