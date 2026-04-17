import { Type, type Static } from '@sinclair/typebox'
import {
  Timestamp, NullableTimestamp, UserIdSchema, ShortcodeSchema, LoungeParticipantSchema, LoungeIdSchema
} from './primitives.ts'

export const LoungeSettingsSchema = Type.Object({
  maxDuration: Type.Integer({ minimum: 20 })
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
  createdAt:    Timestamp,
  endedAt:      NullableTimestamp,
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

