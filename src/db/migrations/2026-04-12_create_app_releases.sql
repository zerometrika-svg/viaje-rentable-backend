CREATE TABLE IF NOT EXISTS app_releases (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(50) NOT NULL,
  version_code INTEGER NOT NULL,
  apk_url TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'app_releases'
      AND column_name = 'active'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'app_releases'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE app_releases RENAME COLUMN active TO is_active;
  END IF;
END $$;

ALTER TABLE app_releases
  ADD COLUMN IF NOT EXISTS version_name VARCHAR(50) NOT NULL DEFAULT '0.0.0';

ALTER TABLE app_releases
  ADD COLUMN IF NOT EXISTS version_code INTEGER NOT NULL DEFAULT 1;

ALTER TABLE app_releases
  ADD COLUMN IF NOT EXISTS apk_url TEXT NOT NULL DEFAULT '';

ALTER TABLE app_releases
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

ALTER TABLE app_releases
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE app_releases
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS app_releases_single_active_true
  ON app_releases (is_active)
  WHERE is_active = true;

