import db from '../db'
import type { TmdbGenre, TmdbFilmData, TmdbFilmRow } from './film.models'

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

export function insertFilm(film: TmdbFilmData) {
  // Derive release year from string
  const year = parseInt(film.release_date.slice(0, 4))
  if (isNaN(year)) throw new Error(`Film ${film.id} has invalid release date`)

  // Ensure that an upsert actually triggers a change
  const added = Date.now()
  const id = Number(film.id)
  const genreIds = JSON.stringify(film.genres.map(genre => genre.id))

  // Generate a transaction that groups film and genre addition
  const tx = db.transaction((film: TmdbFilmData) => {
    // Add or update film data
    db.query(`
        INSERT INTO films (id, title, language, year, runtime, added, poster, backdrop, overview)
        VALUES (@id, @title, @language, @year, @runtime, @added, @poster, @backdrop, @overview)
    `).run({
      id,
      title:    film.title,
      language: film.original_language,
      year,
      runtime:  film.runtime,
      added,
      poster:   film.poster_path,
      backdrop: film.backdrop_path,
      overview: film.overview
    })

    // Add film genres
    db.query(`INSERT INTO film_genres (film_id, genre_id)
              SELECT @id, value
              FROM json_each(@genreIds)`).run({ id, genreIds })
  })

  tx.immediate(film)
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