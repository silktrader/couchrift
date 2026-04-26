-- normalised table to potentially allow multi-matches lounges in the future
CREATE TABLE lounge_matches (
    loungeId  TEXT    NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    filmId    INTEGER NOT NULL,
    matchedAt INTEGER NOT NULL,
    PRIMARY KEY (loungeId, filmId)
) WITHOUT ROWID;