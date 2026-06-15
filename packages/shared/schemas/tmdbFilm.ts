import { Type, type Static } from '@sinclair/typebox'
import { filmConfig } from '../config/film.ts'
import { FilmIdSchema } from './primitives.ts'

export const PersonRoleSchema = Type.Union([
  Type.Literal('actor'),
  Type.Literal('writer'),
  Type.Literal('director')
])
export type PersonRole = Static<typeof PersonRoleSchema>

export const FilmPersonSchema = Type.Object({
  name:     Type.String(),
  image:    Type.String(),
  role:     PersonRoleSchema,
  priority: Type.Integer({ minimum: 0, maximum: filmConfig.people.max })
})
export type FilmPerson = Static<typeof FilmPersonSchema>

export const TmdbFilmYearSchema = Type.Integer({ minimum: filmConfig.year.min })
export const TmdbFilmTitleSchema = Type.String()

// Response used to provide swipeable films to clients.
export const TmdbFilmSchema = Type.Object({
  id:       FilmIdSchema,
  title:    TmdbFilmTitleSchema,
  language: Type.String({ minLength: 2, maxLength: 2 }),
  year:     TmdbFilmYearSchema,
  runtime:  Type.Integer({ minimum: filmConfig.runtime.min, maximum: filmConfig.runtime.max }),
  poster:   Type.String({ format: 'uri' }),
  backdrop: Type.String(),
  overview: Type.String(),
  genres:   Type.Array(Type.String()),
  people:   Type.Array(FilmPersonSchema)
})
export type TmdbFilm = Static<typeof TmdbFilmSchema>
