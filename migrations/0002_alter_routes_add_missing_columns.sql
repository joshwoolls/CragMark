-- Migration number: 0002 	 2026-03-11T08:13:12.447Z
ALTER TABLE routes ADD COLUMN created_by TEXT;
ALTER TABLE routes ADD COLUMN created_date TEXT;
ALTER TABLE routes ADD COLUMN setter_name TEXT;
ALTER TABLE routes ADD COLUMN wall_image_url TEXT;
ALTER TABLE routes ADD COLUMN holds_json TEXT;
ALTER TABLE routes ADD COLUMN published INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_routes_created_by ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_routes_published ON routes(published);
CREATE INDEX IF NOT EXISTS idx_routes_created_date ON routes(created_date);