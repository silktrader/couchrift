import db from '../db'
import type { TmdbGenre, TmdbFilmData } from './film.models'

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
        ON CONFLICT(id) DO UPDATE SET title    = excluded.title,
                                      language = excluded.language,
                                      year     = excluded.year,
                                      runtime  = excluded.runtime,
                                      added    = excluded.added,
                                      poster   = excluded.poster,
                                      backdrop = excluded.backdrop,
                                      overview = excluded.overview
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

    // Delete all previous genres to apply the new set
    db.query(`DELETE
              FROM film_genres
              WHERE film_id = @id`).run({ id })

    // Add film genres
    db.query(`INSERT INTO film_genres (film_id, genre_id)
              SELECT @id, value
              FROM json_each(@genreIds)`).run({ id, genreIds })
  })

  tx.immediate(film)
}