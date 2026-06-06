import { Type, type Static } from '@sinclair/typebox'
import {
  TimestampSchema, NullableTimestamp, UserIdSchema, ShortcodeSchema, LoungeParticipantSchema, LoungeIdSchema
} from './primitives.ts'
import { filmConfig } from '../config/film.ts'

export const LoungeSettingsSchema = Type.Object({
  minRuntime:     Type.Integer({ minimum: filmConfig.runtime.min, maximum: filmConfig.runtime.max }),
  maxRuntime:     Type.Integer({ minimum: filmConfig.runtime.min, maximum: filmConfig.runtime.max }),
  minReleaseYear: Type.Integer({ minimum: filmConfig.year.min }),
  maxReleaseYear: Type.Integer({ minimum: filmConfig.year.min }),
  excludedGenres: Type.Array(Type.Integer())
})
export type LoungeSettings = Static<typeof LoungeSettingsSchema>

export const LoungeCreateSchema = Type.Object({
  settings: LoungeSettingsSchema
})

export const LoungeCreateResponseSchema = Type.Object({ shortcode: ShortcodeSchema })
export type LoungeCreateResponse = Static<typeof LoungeCreateResponseSchema>

export const LoungeResponseSchema = Type.Object({
  id:           LoungeIdSchema,
  creatorId:    UserIdSchema,
  createdAt:    TimestampSchema,
  endedAt:      Type.Optional(NullableTimestamp),
  startedAt:    NullableTimestamp,
  shortcode:    ShortcodeSchema,
  settings:     LoungeSettingsSchema,
  participants: Type.Array(LoungeParticipantSchema)
})
export type LoungeResponse = Static<typeof LoungeResponseSchema>

export const LeaveLoungeResponseSchema = Type.Object({
  deletedLounge: Type.Boolean()
})
export type LeaveLoungeResponse = Static<typeof LeaveLoungeResponseSchema>

