import { Type, type Static } from '@sinclair/typebox'
import { filmConfig } from '../config/film.ts'

// Response used to provide swipeable films to clients.
export const TmdbFilmSchema = Type.Object({
  id:       Type.Integer({ minimum: 0 }),
  title:    Type.String(),
  language: Type.String({ minLength: 2, maxLength: 2 }),
  year:     Type.Integer({ minimum: filmConfig.year.min }),
  runtime:  Type.Integer({ minimum: filmConfig.runtime.min, maximum: filmConfig.runtime.max }),
  poster:   Type.String({ format: 'uri' }),
  backdrop: Type.String(),
  overview: Type.String(),
  genres:   Type.Array(Type.String())
})

export type TmdbFilm = Static<typeof TmdbFilmSchema>;