CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'editor')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash BYTEA PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS plants (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    latin_name    TEXT NOT NULL DEFAULT '',
    type          TEXT NOT NULL,
    lifecycle     TEXT NOT NULL,
    sun           TEXT[] NOT NULL DEFAULT '{}',
    height_min    INT,
    height_max    INT,
    width         INT,
    flower_colors TEXT[] NOT NULL DEFAULT '{}',
    leaf_colors   TEXT[] NOT NULL DEFAULT '{}',
    bloom_months  INT[] NOT NULL DEFAULT '{}',
    native        BOOLEAN NOT NULL DEFAULT false,
    wildlife      TEXT[] NOT NULL DEFAULT '{}',
    evergreen     BOOLEAN NOT NULL DEFAULT false,
    hardy         BOOLEAN NOT NULL DEFAULT true,
    moisture      TEXT[] NOT NULL DEFAULT '{}',
    toxic         BOOLEAN NOT NULL DEFAULT false,
    fragrant      BOOLEAN NOT NULL DEFAULT false,
    edible        BOOLEAN NOT NULL DEFAULT false,
    description   TEXT NOT NULL DEFAULT '',
    photo_key     TEXT NOT NULL DEFAULT '',
    photo_url     TEXT NOT NULL DEFAULT '',
    photo_credit  TEXT NOT NULL DEFAULT '',
    photo_source  TEXT NOT NULL DEFAULT '',
    source_url    TEXT NOT NULL DEFAULT '',
    updated_by    BIGINT REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plants_latin_name_idx ON plants (lower(latin_name));
CREATE INDEX IF NOT EXISTS plants_name_idx ON plants (lower(name));

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
