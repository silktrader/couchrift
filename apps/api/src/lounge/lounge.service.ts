import { nanoid8, legible5 } from '../lib/id'
import { addLounge } from './lounge.repository'
import { Shortcode } from '@couchrift/shared/schemas/primitives'

export type CreateLoungeResult = { ok: true; shortcode: Shortcode } | { ok: false; error: 'DB_ERROR' }

export function createLounge(userId: string, settings: { maxDuration: number }):
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
      ok:        true,
      shortcode: loungeData.shortcode
    }
  } catch (error) {
    console.error('Lounge creation failed: ', error)
    return { ok: false, error: 'DB_ERROR' }
  }

}