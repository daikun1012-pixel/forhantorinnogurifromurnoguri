-- Initial schema for the couple place wishlist app.
-- SQLite / Cloudflare D1. Mirrors src/types/index.ts.
-- Booleans are stored as INTEGER (0/1). Timestamps are ISO-8601 TEXT.

-- Users -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  avatar_color TEXT NOT NULL
);

-- Couples ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS couples (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL
);

-- Couple members (join between users and couples) -----------------------
CREATE TABLE IF NOT EXISTS couple_members (
  couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner', 'partner')),
  joined_at TEXT NOT NULL,
  PRIMARY KEY (couple_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_couple_members_user
  ON couple_members (user_id);

-- Places ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS places (
  id           TEXT PRIMARY KEY,
  couple_id    TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (
                 category IN ('cafe', 'restaurant', 'activity',
                             'travel', 'shopping', 'etc')),
  address      TEXT NOT NULL,
  road_address TEXT NOT NULL,
  latitude     REAL NOT NULL,
  longitude    REAL NOT NULL,
  source_url   TEXT NOT NULL DEFAULT '',
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_places_couple
  ON places (couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_couple_category
  ON places (couple_id, category);

-- Place reactions (per user, per place) ---------------------------------
CREATE TABLE IF NOT EXISTS place_reactions (
  id          TEXT PRIMARY KEY,
  place_id    TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  want_to_go  INTEGER NOT NULL DEFAULT 0 CHECK (want_to_go IN (0, 1)),
  visited     INTEGER NOT NULL DEFAULT 0 CHECK (visited IN (0, 1)),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  memo        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_place_reactions_place
  ON place_reactions (place_id);
CREATE INDEX IF NOT EXISTS idx_place_reactions_user
  ON place_reactions (user_id);

-- Place comments (shared between the couple) ----------------------------
CREATE TABLE IF NOT EXISTS place_comments (
  id         TEXT PRIMARY KEY,
  place_id   TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_place_comments_place
  ON place_comments (place_id, created_at);
