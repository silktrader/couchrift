import db from '../db'
import type { TmdbGenre, TmdbFilmData, TmdbFilmRow } from './film.models'
import type { PersonRole } from '@couchrift/shared/schemas/tmdbFilm.ts'
import type { FilmIngestionData } from './tmdb-ingestion.ts'

export function getOldestGenreUpdate() {
  return db.query(`
      SELECT min(updatedAt) AS timestamp
      FROM genres
  `).get() as { timestamp: number }
}

export function insertGenres(genres: TmdbGenre[]) {
  db.transaction((genres: TmdbGenre[]) => {
    for (const genre of genres) {
      db.query(`
          INSERT INTO genres (id, name, updatedAt)
          VALUES (@id, @name, @updatedAt)
          ON CONFLICT(id) DO UPDATE SET name      = excluded.name,
                                        updatedAt = @updatedAt
      `).run({ id: genre.id, name: genre.name, updatedAt: Date.now() })
    }
  }).immediate(genres)
}

export function getGenres() {
  return db.query<{ id: number, name: string }, []>(`
      SELECT id, name
      FROM genres
  `).all()
}

export function countFilms(): number {
  const { total } = db.query(`
      SELECT count(id) AS total
      FROM films
  `).get() as { total: number }
  return total
}

// Fetch the IDs provided by `ids` that are already present in `films`.
export function getExistingFilmIds(ids: number[]) {
  return db.query<{ id: number }, { ids: string }>(`
      SELECT id
      FROM films
      WHERE id IN (SELECT value FROM json_each(@ids))
  `).all({ ids: JSON.stringify(ids) })
}

const insertFilmData = db.query(`
    INSERT INTO films (id, title, language, year, runtime, added, poster, backdrop, overview)
    VALUES (@id, @title, @language, @year, @runtime, @added, @poster, @backdrop, @overview)
`)

const insertFilmGenre = db.query(`
    INSERT INTO film_genres (film_id, genre_id)
    VALUES (@filmId, @genreId)
`)

// Insert a person and update their image when missing
const insertPerson = db.query(`
    INSERT INTO people (id, name, image)
    VALUES (@id, @name, @image)
    ON CONFLICT (id) DO UPDATE SET image = excluded.image
    WHERE people.image IS NULL
      AND excluded.image IS NOT NULL
`)

// Mind the same role appearing twice, such as "writer" being triggered by "Screenplay" and "Novel"
const insertFilmPerson = db.query(`
    INSERT INTO film_people (filmId, personId, role, priority)
    VALUES (@filmId, @id, @role, @priority)
    ON CONFLICT (filmId, personId, role) DO NOTHING
`)

export function insertFilm(data: FilmIngestionData) {

  const { genres, people, ...film } = data

  // Generate a transaction that handles film data, genres, cast and crew insertions
  const tx = db.transaction(() => {
    // Add film data with the assumption that existing film IDs are excluded from ingestion
    insertFilmData.run({ ...film })

    // Add film genres
    genres.forEach(genreId => insertFilmGenre.run({ filmId: film.id, genreId }))

    // Add film people
    people.forEach(person => {
      insertPerson.run({ ...person })
      insertFilmPerson.run({ filmId: film.id, ...person })
    })
  })

  tx.immediate()
}

export function getFilmDetails(filmId: number) {
  const filmRow = db.query<TmdbFilmRow, { filmId: number }>(`
      SELECT f.id,
             title,
             language,
             year,
             runtime,
             poster,
             backdrop,
             overview,
             json_group_array(DISTINCT g.name) AS genres
      FROM films f
               LEFT JOIN film_genres fg ON f.id = fg.film_id
               LEFT JOIN genres g ON g.id = fg.genre_id
      WHERE f.id = @filmId`).get({ filmId })
  return filmRow && { ...filmRow, genres: JSON.parse(filmRow.genres) as string[] }
}