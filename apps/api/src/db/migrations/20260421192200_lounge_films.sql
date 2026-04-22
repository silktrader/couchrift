CREATE TABLE IF NOT EXISTS lounge_films (
    loungeId TEXT    NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    filmId   INTEGER NOT NULL, -- TMDB id, stands alone and is resilient when films are removed
    PRIMARY KEY (loungeId, filmId)
) WITHOUT ROWID;