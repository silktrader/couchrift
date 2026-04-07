import { nanoid8, legible5 } from '../lib/id'
import { addLounge } from './lounge.repository'
import { LoungeResponse } from '@couchrift/shared/schemas/lounge'

export type CreateLoungeResult = { ok: true; lounge: LoungeResponse } | { ok: false; error: 'DB_ERROR' }

export function createLounge(userId: string, userName: string, settings: { maxDuration: number }):
  CreateLoungeResult {

  // Generate an ID and timestamp
  const loungeData = {
    id:        nanoid8(),
    createdAt: Date.now(),
    creatorId: userId,
    settings:  settings,
    shortcode: legible5()
  }

  try {
    addLounge(loungeData)
    return {
      ok:     true,
      lounge: { ...loungeData, endedAt: null, startedAt: null, participants: [{ id: userId, name: userName }] }
    }
  } catch (error) {
    console.error('Lounge creation failed: ', error)
    return { ok: false, error: 'DB_ERROR' }
  }

}