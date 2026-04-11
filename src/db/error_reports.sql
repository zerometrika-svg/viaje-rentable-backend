CREATE TABLE IF NOT EXISTS error_reports (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  description TEXT,
  app_version VARCHAR(50),
  device_hash TEXT,
  device_name TEXT,
  android_version VARCHAR(32),
  country VARCHAR(8),
  screen VARCHAR(64),
  source VARCHAR(32) NOT NULL DEFAULT 'manual_report',
  user_email VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
