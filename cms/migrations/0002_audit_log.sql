CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  article_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
