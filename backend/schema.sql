-- BookARide PostgreSQL Schema (Neon)
-- Migrated from MongoDB - uses JSONB for flexible document storage
-- with extracted columns for frequently queried/indexed fields.
--
-- Usage: psql $DATABASE_URL -f schema.sql

-- ============================================================
-- CORE BOOKING TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_id ON bookings (id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings ((data->>'date'));
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON bookings ((data->>'payment_status'));
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings ((data->>'referenceNumber'));
CREATE INDEX IF NOT EXISTS idx_bookings_data ON bookings USING GIN (data);

CREATE TABLE IF NOT EXISTS shuttle_bookings (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_id ON shuttle_bookings (id);
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_status ON shuttle_bookings ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_date ON shuttle_bookings ((data->>'date'));
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_data ON shuttle_bookings USING GIN (data);

CREATE TABLE IF NOT EXISTS shuttle_runs (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shuttle_runs_id ON shuttle_runs (id);
CREATE INDEX IF NOT EXISTS idx_shuttle_runs_date ON shuttle_runs ((data->>'date'));

CREATE TABLE IF NOT EXISTS bookings_archive (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_archive_id ON bookings_archive (id);

CREATE TABLE IF NOT EXISTS deleted_bookings (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deleted_bookings_id ON deleted_bookings (id);

-- ============================================================
-- USER & AUTH TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users ((data->>'username'));
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users ((data->>'email'));

CREATE TABLE IF NOT EXISTS admin_sessions (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions ((data->>'session_token'));

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens ((data->>'token'));

-- ============================================================
-- DRIVER TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS drivers (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_id ON drivers (id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_drivers_name ON drivers ((data->>'name'));

CREATE TABLE IF NOT EXISTS driver_applications (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_applications_id ON driver_applications (id);

CREATE TABLE IF NOT EXISTS driver_locations (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_id ON vehicles (id);

-- ============================================================
-- PAYMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_id ON payment_transactions (id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_booking ON payment_transactions ((data->>'booking_id'));
CREATE INDEX IF NOT EXISTS idx_payment_tx_session ON payment_transactions ((data->>'stripe_session_id'));
CREATE INDEX IF NOT EXISTS idx_payment_tx_data ON payment_transactions USING GIN (data);

CREATE TABLE IF NOT EXISTS afterpay_transactions (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_afterpay_token ON afterpay_transactions ((data->>'token'));

-- ============================================================
-- TRACKING TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_sessions (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_id ON tracking_sessions (id);
CREATE INDEX IF NOT EXISTS idx_tracking_ref ON tracking_sessions ((data->>'trackingRef'));
CREATE INDEX IF NOT EXISTS idx_tracking_booking ON tracking_sessions ((data->>'bookingId'));

-- ============================================================
-- COMMUNICATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS email_logs (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_data ON email_logs USING GIN (data);

CREATE TABLE IF NOT EXISTS email_templates (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_id ON email_templates (id);

CREATE TABLE IF NOT EXISTS abandoned_bookings (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_email ON abandoned_bookings ((data->>'email'));

-- ============================================================
-- CONFIGURATION & SYSTEM TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS counters (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cache (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON cache ((data->>'key'));

CREATE TABLE IF NOT EXISTS pending_approvals (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_phone ON pending_approvals ((data->>'admin_phone'));

CREATE TABLE IF NOT EXISTS calendar_auth (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_types (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_config (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_notes (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_email ON customer_notes ((data->>'customer_email'));

CREATE TABLE IF NOT EXISTS status_checks (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xero_tokens (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_partners (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_bookings (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS airline_partners (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_pages (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_path ON seo_pages ((data->>'page_path'));

CREATE TABLE IF NOT EXISTS seo_health_reports (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_check_reports (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_tasks (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_alerts_sent (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_alerts_key ON return_alerts_sent ((data->>'alert_key'));

-- ============================================================
-- PRICING ENQUIRIES (admin live pricing tool — no booking)
-- ============================================================

CREATE TABLE IF NOT EXISTS pricing_enquiries (
    _id         BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_enquiries_data ON pricing_enquiries USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_pricing_enquiries_admin ON pricing_enquiries ((data->>'admin'));

-- ============================================================
-- HELPER: Auto-create table for unknown collections
-- This function is called by the compatibility layer when
-- a collection is accessed that doesn't have a table yet.
-- ============================================================

CREATE OR REPLACE FUNCTION ensure_collection_table(tbl TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I (
            _id     BIGSERIAL PRIMARY KEY,
            id      TEXT UNIQUE,
            data    JSONB NOT NULL DEFAULT ''{}'',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )', tbl
    );
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%I_data ON %I USING GIN (data)', tbl, tbl
    );
END;
$$ LANGUAGE plpgsql;
