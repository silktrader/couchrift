import db from '../db'
import type { TmdbGenre } from './film.models'

export function getOldestGenreUpdate() {
  return db.query(`
      SELECT min(updatedAt) AS timestamp
      FROM genres
  `).get() as { timestamp: number }
}

export function insertGenres(genres: TmdbGenre[]) {
  const updatedAt = Math.floor(Date.now() / 1000)
  db.transaction((genres: TmdbGenre[]) => {
    for (const genre of genres) {
      db.query(`
          INSERT INTO genres (id, name, updatedAt)
          VALUES (@id, @name, @updatedAt)
          ON CONFLICT(id) DO UPDATE SET name      = excluded.name,
                                        updatedAt = @updatedAt
      `).run({ id: genre.id, name: genre.name, updatedAt })
    }
  }).immediate(genres)
}