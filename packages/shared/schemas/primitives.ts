import { Type, type Static } from '@sinclair/typebox'
import { ID_LENGTH, ID_ALPHABETS } from '../config/ids.ts'
import { UserName } from './auth.ts'

export const TimestampSchema = Type.Integer({
  minimum:     0,
  description: 'Unix timestamp in milliseconds'
})

export const NullableTimestamp = Type.Union([TimestampSchema, Type.Null()])

const alphaRegex = (alphabet: string, length: number) =>
  `^[${alphabet}]{${length}}$`

export const UserIdSchema = Type.String({
  minLength: ID_LENGTH.nanoid8,
  maxLength: ID_LENGTH.nanoid8,
  pattern:   alphaRegex(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid8)
})

export const ShortcodeSchema = Type.String({
  minLength: ID_LENGTH.shortcode,
  maxLength: ID_LENGTH.shortcode,
  pattern:   alphaRegex(ID_ALPHABETS.shortcode, ID_LENGTH.shortcode)
})
export type Shortcode = Static<typeof ShortcodeSchema>

export const LoungeIdSchema = Type.String({
  minLength: ID_LENGTH.nanoid12,
  maxLength: ID_LENGTH.nanoid12,
  pattern:   alphaRegex(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid12)
})
export type LoungeId = Static<typeof LoungeIdSchema>

export const LoungeParticipantSchema = Type.Object({
  name:  UserName,
  id:    UserIdSchema,
  image: Type.Optional(Type.Union([Type.String(), Type.Null(), Type.Undefined()]))
})
export type LoungeParticipant = Static<typeof LoungeParticipantSchema>

export const FilmIdSchema = Type.Integer({ minimum: 0 })