-- BetterAuth tables for user authentication
-- Must be renamed by the configurator
-- BetterAuth internally works with JavaScript Date objects

CREATE TABLE IF NOT EXISTS users (
    id            TEXT    NOT NULL PRIMARY KEY,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image         TEXT,
    isAnonymous   INTEGER          DEFAULT 0, -- for later use by the anonymous plugin
    createdAt     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updatedAt     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sessions (
    id        TEXT PRIMARY KEY,
    userId    TEXT    NOT NULL NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token     TEXT    NOT NULL UNIQUE,
    expiresAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS accounts (
    id                    TEXT PRIMARY KEY,
    userId                TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    accountId             TEXT    NOT NULL,
    providerId            TEXT    NOT NULL,
    accessToken           TEXT,
    refreshToken          TEXT,
    accessTokenExpiresAt  INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope                 TEXT,
    idToken               TEXT,
    password              TEXT,
    createdAt             INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updatedAt             INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS verifications (
    id         TEXT PRIMARY KEY,
    identifier TEXT    NOT NULL,
    value      TEXT    NOT NULL,
    expiresAt  INTEGER NOT NULL,
    createdAt  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updatedAt  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);