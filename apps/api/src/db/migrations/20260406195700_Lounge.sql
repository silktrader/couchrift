CREATE TABLE IF NOT EXISTS lounges (
    id         TEXT PRIMARY KEY,
    creator_id TEXT    NOT NULL,
    shortcode  TEXT    NOT NULL, -- must be unique among active lounges
    created_at INTEGER NOT NULL,
    started_at INTEGER,          -- start timestamp required by late reconnects on missing WS updates
    ended_at   INTEGER,          -- end timestamp signals the lounge's inactivity
    settings   TEXT    NOT NULL, -- JSON field
    FOREIGN KEY (creator_id) REFERENCES users (id),
    CONSTRAINT json_settings CHECK (json_valid(settings))
);

CREATE INDEX IF NOT EXISTS idx_lounges_creator ON lounges (creator_id);

CREATE TABLE IF NOT EXISTS lounge_participants (
    lounge_id       TEXT NOT NULL,
    participant_id  TEXT NOT NULL,
    disconnected_at INTEGER,
    PRIMARY KEY (lounge_id, participant_id),
    FOREIGN KEY (lounge_id) REFERENCES lounges (id),
    FOREIGN KEY (participant_id) REFERENCES users (id)
);