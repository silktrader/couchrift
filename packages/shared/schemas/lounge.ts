import { Type, type Static } from '@sinclair/typebox'
import { Timestamp, NullableTimestamp, NanoId12, NanoId8, Shortcode, LoungeParticipant } from './primitives.ts'

export const LoungeSettingsSchema = Type.Object({
  maxDuration: Type.Integer({ minimum: 20 })
})

export const LoungeCreateSchema = Type.Object({
  settings: LoungeSettingsSchema
})

export const LoungeResponseSchema = Type.Object({
  id:           NanoId12,
  creatorId:    NanoId8,
  createdAt:    Timestamp,
  endedAt:      NullableTimestamp,
  startedAt:    NullableTimestamp,
  shortcode:    Shortcode,
  settings:     LoungeSettingsSchema,
  participants: Type.Array(LoungeParticipant)
})
export type LoungeResponse = Static<typeof LoungeResponseSchema>

export type LoungeSettings = Static<typeof LoungeSettingsSchema>
