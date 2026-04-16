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

