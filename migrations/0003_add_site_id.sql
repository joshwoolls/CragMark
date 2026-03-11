-- Migration number: 0003 	 2026-03-11T10:00:00.000Z
ALTER TABLE routes ADD COLUMN site_id TEXT NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_routes_site_id ON routes(site_id);
