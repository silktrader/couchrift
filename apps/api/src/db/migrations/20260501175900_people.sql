CREATE TABLE IF NOT EXISTS people (
    id    INTEGER PRIMARY KEY, -- TMDB person id
    name  TEXT NOT NULL,
    image TEXT                 -- nullable: not everyone has a profile photo
);

CREATE TABLE IF NOT EXISTS film_people (
    filmId   INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
    personId INTEGER NOT NULL REFERENCES people (id) ON DELETE CASCADE,
    role     TEXT    NOT NULL CHECK (role IN ('actor', 'director', 'writer')),
    priority INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (filmId, personId, role) -- role in PK: same person can direct AND write
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_film_people_film ON film_people (filmId);
CREATE INDEX IF NOT EXISTS idx_film_people_person ON film_people (personId);