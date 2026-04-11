CREATE TABLE IF NOT EXISTS error_reports (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  description TEXT,
  app_version VARCHAR(50),
  device_hash TEXT,
  device_name TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

