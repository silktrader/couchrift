CREATE TABLE IF NOT EXISTS swipes (
    loungeId TEXT    NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    userId   TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    filmId   INTEGER NOT NULL,                                  -- ref. ext. TMDB id, needs not reference stored film
    swipedAt INTEGER NOT NULL CHECK (swipedAt > 1000000000000), -- circa 2001 in ms
    value    INTEGER NOT NULL CHECK (value IN (1, -1)),         -- like (1) or dislike (-1)
    PRIMARY KEY (loungeId, userId, filmId)
) WITHOUT ROWID;

CREATE INDEX idx_swipes_match ON swipes (loungeId, filmId) WHERE value = 1; -- helps with match finding
