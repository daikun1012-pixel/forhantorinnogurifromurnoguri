-- Seed data: demo users and one couple.
-- Matches the temporary mock-auth identity (user_daiki / couple_demo).

INSERT OR IGNORE INTO users (id, name, email, avatar_color) VALUES
  ('user_daiki',   '다이키', 'daiki@example.com',   '#fb7185'),
  ('user_partner', '파트너', 'partner@example.com', '#60a5fa');

INSERT OR IGNORE INTO couples (id, name, invite_code, created_at) VALUES
  ('couple_demo', '다이키 ❤️ 파트너', 'LOVE-DEMO', '2025-11-02T09:00:00.000Z');

INSERT OR IGNORE INTO couple_members (couple_id, user_id, role, joined_at) VALUES
  ('couple_demo', 'user_daiki',   'owner',   '2025-11-02T09:00:00.000Z'),
  ('couple_demo', 'user_partner', 'partner', '2025-11-02T09:12:00.000Z');
