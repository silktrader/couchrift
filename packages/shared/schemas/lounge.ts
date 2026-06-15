import { Type, type Static } from '@sinclair/typebox'
import {
  TimestampSchema, NullableTimestamp, UserIdSchema, ShortcodeSchema, LoungeParticipantSchema, LoungeIdSchema
} from './primitives.ts'
import { filmConfig } from '../config/film.ts'
import { Value } from '@sinclair/typebox/value'
import { SwipeSchema } from './swipes.ts'

export const LoungeSettingsSchema = Type.Object({
  minRuntime:     Type.Integer({ minimum: filmConfig.runtime.min, maximum: filmConfig.runtime.max }),
  maxRuntime:     Type.Integer({ minimum: filmConfig.runtime.min, maximum: filmConfig.runtime.max }),
  minReleaseYear: Type.Integer({ minimum: filmConfig.year.min }),
  maxReleaseYear: Type.Integer({ minimum: filmConfig.year.min }),
  excludedGenres: Type.Array(Type.Integer())
})
export type LoungeSettings = Static<typeof LoungeSettingsSchema>

const defaultSettings: LoungeSettings = {
  minRuntime:     filmConfig.runtime.min,
  maxRuntime:     filmConfig.runtime.max,
  minReleaseYear: filmConfig.year.min,
  maxReleaseYear: new Date().getFullYear(),
  excludedGenres: []
}

// Attempts to parse the JSON settings string and returns a default on validation failure with notification.
export function parseLoungeSettings(settingsJson: string): LoungeSettings {
  try {
    const parsed = JSON.parse(settingsJson)
    if (Value.Check(LoungeSettingsSchema, parsed)) {
      return parsed
    }
  } catch (error) {
    console.error('Failed to parse or validate lounge settings, falling back to default:', error)
  }
  return defaultSettings
}

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
  participants: Type.Array(LoungeParticipantSchema),
  swipes:       Type.Array(SwipeSchema)
})
export type LoungeResponse = Static<typeof LoungeResponseSchema>

export const LeaveLoungeResponseSchema = Type.Object({
  deletedLounge: Type.Boolean()
})
export type LeaveLoungeResponse = Static<typeof LeaveLoungeResponseSchema>


