CREATE TABLE IF NOT EXISTS films (
    id       INTEGER PRIMARY KEY,                           -- TMDB id
    title    TEXT    NOT NULL,
    language TEXT    NOT NULL CHECK (length(language) = 2), -- ISO 639-1
    year     INTEGER NOT NULL CHECK (year >= 1888),
    runtime  INTEGER NOT NULL CHECK (runtime > 0),
    added    INTEGER NOT NULL DEFAULT (unixepoch()),
    poster   TEXT    NOT NULL,
    backdrop TEXT    NOT NULL,
    overview TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS genres (
    id        INTEGER PRIMARY KEY,
    name      TEXT    NOT NULL UNIQUE,
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS film_genres (
    film_id  INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres (id),
    PRIMARY KEY (film_id, genre_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_film_genres_genre
    ON film_genres (genre_id)