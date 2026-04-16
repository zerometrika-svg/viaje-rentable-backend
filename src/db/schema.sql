CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_devices INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    android_version VARCHAR(32),
    app_version VARCHAR(50),
    diagnostic_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    bound_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_hash)
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS app_releases (
    id SERIAL PRIMARY KEY,
    version_name VARCHAR(50) NOT NULL,
    version_code INTEGER NOT NULL,
    apk_url TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_releases_single_active_true
    ON app_releases (active)
    WHERE active = true;

CREATE TABLE IF NOT EXISTS uber_offer_failure_diagnostics (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    device_hash TEXT,
    device_model TEXT,
    android_version VARCHAR(32),
    app_version VARCHAR(50),
    uber_version VARCHAR(50),

    event_type VARCHAR(64),
    class_name TEXT,
    raw_text_count INTEGER,
    clean_text_count INTEGER,
    clean_texts_json JSONB,

    detected_precio DOUBLE PRECISION,
    pickup_min DOUBLE PRECISION,
    pickup_km DOUBLE PRECISION,
    viaje_min DOUBLE PRECISION,
    viaje_km DOUBLE PRECISION,

    discard_reason VARCHAR(80),
    parse_source_info TEXT,
    resolution VARCHAR(32),
    density INTEGER,
    locale VARCHAR(32),

    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_uber_offer_diag_created_at
    ON uber_offer_failure_diagnostics (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uber_offer_diag_status
    ON uber_offer_failure_diagnostics (status);

CREATE INDEX IF NOT EXISTS idx_uber_offer_diag_reason
    ON uber_offer_failure_diagnostics (discard_reason);

CREATE INDEX IF NOT EXISTS idx_uber_offer_diag_device_hash
    ON uber_offer_failure_diagnostics (device_hash);
