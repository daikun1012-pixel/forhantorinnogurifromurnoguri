/// <reference types="@cloudflare/workers-types" />

// Schema is created lazily (idempotent) so the app works without a manual
// migration step. The same DDL is mirrored in migrations/0001_init.sql for
// `wrangler d1 migrations apply`.

let schemaReady: Promise<void> | null = null;

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     avatar_color TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS couples (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     invite_code TEXT NOT NULL UNIQUE,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS couple_members (
     couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('owner','partner')),
     joined_at TEXT NOT NULL,
     PRIMARY KEY (couple_id, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_members_user ON couple_members(user_id)`,
  `CREATE TABLE IF NOT EXISTS places (
     id TEXT PRIMARY KEY,
     couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     category TEXT NOT NULL,
     address TEXT NOT NULL DEFAULT '',
     map_url TEXT NOT NULL DEFAULT '',
     latitude REAL,
     longitude REAL,
     created_by TEXT NOT NULL REFERENCES users(id),
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_places_couple ON places(couple_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS place_reactions (
     id TEXT PRIMARY KEY,
     place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     want_to_go INTEGER NOT NULL DEFAULT 0,
     visited INTEGER NOT NULL DEFAULT 0,
     priority TEXT NOT NULL DEFAULT 'medium',
     memo TEXT NOT NULL DEFAULT '',
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     UNIQUE (place_id, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_reactions_place ON place_reactions(place_id)`,
  `CREATE TABLE IF NOT EXISTS place_comments (
     id TEXT PRIMARY KEY,
     place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     body TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_comments_place ON place_comments(place_id, created_at)`,
];

// Columns added after the initial release. Applied with ALTER TABLE for
// databases created before the column existed; "duplicate column" errors are
// expected and ignored.
const ALTERS = [
  `ALTER TABLE places ADD COLUMN latitude REAL`,
  `ALTER TABLE places ADD COLUMN longitude REAL`,
];

async function migrate(db: D1Database): Promise<void> {
  await db.batch(DDL.map((sql) => db.prepare(sql)));
  for (const sql of ALTERS) {
    try {
      await db.prepare(sql).run();
    } catch {
      // Column already exists — safe to ignore.
    }
  }
}

export function ensureSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = migrate(db).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function inviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const AVATAR_COLORS = [
  "#fb7185",
  "#60a5fa",
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#f472b6",
];

export function pickColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
