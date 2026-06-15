import { Type, type Static } from '@sinclair/typebox'
import { FilmIdSchema, TimestampSchema } from './primitives.ts'
import { TmdbFilmYearSchema, TmdbFilmTitleSchema, FilmPersonSchema } from './tmdbFilm.ts'

export const SwipeSchema = Type.Object({
  id:       FilmIdSchema,
  title:    TmdbFilmTitleSchema,
  year:     TmdbFilmYearSchema,
  like:     Type.Boolean(),
  swipedAt: TimestampSchema
})
export type Swipe = Static<typeof SwipeSchema>