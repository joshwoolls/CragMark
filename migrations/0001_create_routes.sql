-- Migration number: 0001 	 2026-03-11T07:37:14.319Z
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  style TEXT,
  description TEXT,
  setter_name TEXT,
  wall_image_url TEXT,
  holds_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routes_created_by ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_routes_published ON routes(published);
CREATE INDEX IF NOT EXISTS idx_routes_created_date ON routes(created_date);