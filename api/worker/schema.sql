-- D1 Database Schema for Chinese Poetry
-- ????
CREATE TABLE IF NOT EXISTS poems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '??',
  dynasty TEXT NOT NULL DEFAULT '',
  collection TEXT NOT NULL DEFAULT '',
  collection_id TEXT NOT NULL DEFAULT '',
  rhythmic TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  excerpt TEXT DEFAULT '',
  length INTEGER DEFAULT 0,
  source_path TEXT DEFAULT '',
  paragraphs TEXT DEFAULT '[]'
);

-- ????
CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);

-- ????
CREATE INDEX IF NOT EXISTS idx_poems_collection ON poems(collection_id);

-- ?????
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dynasty TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  count INTEGER DEFAULT 0
);

-- FTS5 ???????
CREATE VIRTUAL TABLE IF NOT EXISTS poems_fts USING fts5(
  title, author, excerpt,
  content='poems',
  content_rowid='rowid',
  tokenize='unicode61'
);
