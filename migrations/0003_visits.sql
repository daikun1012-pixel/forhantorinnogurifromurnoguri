-- Visit records / memories (mirrors functions/_lib/db.ts).
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  visited_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visits_couple ON visits(couple_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_place ON visits(place_id);
