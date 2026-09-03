-- Relies on the deterministic lexicographical ordering of user IDs to store friendships.
-- Allows for one bilateral relationship to be represented as one table row.
CREATE TABLE IF NOT EXISTS friendships (
    userIdA      TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    userIdB      TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    befriendedAt INTEGER NOT NULL CHECK (befriendedAt > 1000000000000),
    PRIMARY KEY (userIdA, userIdB),
    CHECK (userIdA < userIdB)
) WITHOUT ROWID;


-- Find all the friendships of a given user efficiently.
-- The primary key is already sorted by `userIdA`.
CREATE INDEX IF NOT EXISTS idx_friendships_userB ON friendships (userIdB);

CREATE TABLE friend_requests (
    id          TEXT PRIMARY KEY,
    requesterId TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    recipientId TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    createdAt   INTEGER NOT NULL CHECK (createdAt > 1000000000000),
    UNIQUE (requesterId, recipientId)
);