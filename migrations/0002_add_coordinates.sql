-- Add coordinates to places for map display (mirrors functions/_lib/db.ts).
ALTER TABLE places ADD COLUMN latitude REAL;
ALTER TABLE places ADD COLUMN longitude REAL;
