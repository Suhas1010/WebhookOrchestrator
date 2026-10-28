
-- HookRelay: Initial database schema
-- Migration: 001_initial_schema.sql


-- 1. Tenants: companies using HookRelay
CREATE TABLE tenants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users: people belonging to a tenant
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'owner'
        CHECK (role IN ('owner', 'admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. API keys: store hashes, never plaintext API keys
CREATE TABLE api_keys (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_prefix VARCHAR(32) NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Event types: e.g. invoice.paid, user.created
CREATE TABLE event_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name),
    UNIQUE (id, tenant_id)
);

-- 5. Endpoints: destination URLs for webhook delivery
CREATE TABLE endpoints (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT,
    secret TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    disabled_reason TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0
        CHECK (consecutive_failures >= 0),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, tenant_id)
);

-- 6. Endpoint subscriptions: event types an endpoint receives.
-- No subscription rows for an endpoint means it receives all event types.
CREATE TABLE endpoint_subscriptions (
    tenant_id BIGINT NOT NULL,
    endpoint_id BIGINT NOT NULL,
    event_type_id BIGINT NOT NULL,

    PRIMARY KEY (endpoint_id, event_type_id),

    FOREIGN KEY (endpoint_id, tenant_id)
        REFERENCES endpoints(id, tenant_id)
        ON DELETE CASCADE,

    FOREIGN KEY (event_type_id, tenant_id)
        REFERENCES event_types(id, tenant_id)
        ON DELETE CASCADE
);
-- 7. Events: original payloads submitted by tenants
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type_id BIGINT NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (event_type_id, tenant_id)
        REFERENCES event_types(id, tenant_id),

    UNIQUE (tenant_id, idempotency_key),
    UNIQUE (id, tenant_id)
);

-- 8. Deliveries: one event delivered to one endpoint
CREATE TABLE deliveries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    endpoint_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_flight', 'delivered', 'dead')),
    attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (attempt_count >= 0),
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    last_status_code INTEGER,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (event_id, tenant_id)
        REFERENCES events(id, tenant_id) ON DELETE CASCADE,

    FOREIGN KEY (endpoint_id, tenant_id)
        REFERENCES endpoints(id, tenant_id),

    UNIQUE (event_id, endpoint_id)
);

-- 9. Delivery attempts: history of individual HTTP attempts
CREATE TABLE delivery_attempts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delivery_id BIGINT NOT NULL
        REFERENCES deliveries(id) ON DELETE CASCADE,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_code INTEGER,
    latency_ms INTEGER CHECK (latency_ms >= 0),
    response_body TEXT,
    error_message TEXT
);

