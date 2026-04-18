CREATE TABLE IF NOT EXISTS lounges (
    id        TEXT PRIMARY KEY,
    creatorId TEXT    NOT NULL REFERENCES users (id),
    shortcode TEXT    NOT NULL, -- must be unique among active lounges
    createdAt INTEGER NOT NULL,
    startedAt INTEGER,          -- start timestamp required by late reconnects on missing WS updates
    endedAt   INTEGER,          -- end timestamp signals the lounge's inactivity
    settings  TEXT    NOT NULL, -- JSON field
    CONSTRAINT json_settings CHECK (json_valid(settings))
);

CREATE INDEX IF NOT EXISTS idx_lounges_creator ON lounges (creatorId);

CREATE TABLE IF NOT EXISTS lounge_participants (
    loungeId       TEXT NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    participantId  TEXT NOT NULL REFERENCES users (id),
    disconnectedAt INTEGER,
    PRIMARY KEY (loungeId, participantId)
) WITHOUT ROWID;