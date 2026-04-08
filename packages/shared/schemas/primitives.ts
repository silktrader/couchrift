import { Type, type Static } from '@sinclair/typebox'
import { ID_LENGTH, ID_ALPHABETS } from '../config/ids.ts'
import { UserName } from './auth.ts'

export const Timestamp = Type.Integer({
  minimum:     0,
  description: 'Unix timestamp (seconds)'
})

export const NullableTimestamp = Type.Union([Timestamp, Type.Null()])

const alphaRegex = (alphabet: string, length: number) =>
  `^[${alphabet}]{${length}}$`

export const NanoId8 = Type.String({
  minLength: ID_LENGTH.nanoid8,
  maxLength: ID_LENGTH.nanoid8,
  pattern:   alphaRegex(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid8)
})

export const NanoId12 = Type.String({
  minLength: ID_LENGTH.nanoid12,
  maxLength: ID_LENGTH.nanoid12,
  pattern:   alphaRegex(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid12)
})

export const ShortcodeSchema = Type.String({
  minLength: ID_LENGTH.legible5,
  maxLength: ID_LENGTH.legible5,
  pattern:   alphaRegex(ID_ALPHABETS.legible, ID_LENGTH.legible5)
})

export type Shortcode = Static<typeof ShortcodeSchema>

export const LoungeParticipant = Type.Object({
  name: UserName,
  id:   NanoId8
})