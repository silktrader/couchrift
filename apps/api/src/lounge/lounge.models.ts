import type { LoungeSettings } from '@couchrift/shared/schemas/lounge.ts'

export interface AddLoungeData {
  id: string
  creatorId: string
  createdAt: number
  shortcode: string
  settings: LoungeSettings
}

// Used by the "Add Swipe" endpoint.
export interface AddSwipeData {
  loungeId: string,
  userId: string,
  filmId: number,
  like: boolean
}