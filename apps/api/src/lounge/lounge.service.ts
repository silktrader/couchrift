import { nanoid8, legible5 } from '../lib/id'
import {
  addLounge, findActiveLoungeByCode, findActiveUserLounges, deleteActiveLoungeParticipant
} from './lounge.repository'
import { Shortcode } from '@couchrift/shared/schemas/primitives'
import { LoungeResponse } from '@couchrift/shared/schemas/lounge'

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

export function getActiveLoungeByCode(shortcode: string, userId: string):
  { ok: true, lounge: LoungeResponse } | { ok: false, error: 'NOT_FOUND' } {
  const lounge = findActiveLoungeByCode(shortcode, userId)
  return lounge ? { ok: true, lounge } : { ok: false, error: 'NOT_FOUND' }
}

// Get active lounges the user has joined or created.
export function getActiveUserLounges(userId: string) {
  const rows = findActiveUserLounges(userId)

  // Expect only a handful of lounges, avoid hashsets
  const lounges: LoungeResponse[] = []

  // Rows are sorted according to lounge creation date
  for (const row of rows) {
    let rowLounge = lounges.at(-1)
    if (rowLounge === undefined || rowLounge.id !== row.id) {
      rowLounge = {
        id:           row.id,
        creatorId:    row.creatorId,
        createdAt:    row.createdAt,
        startedAt:    row.startedAt,
        endedAt:      null,
        shortcode:    row.shortcode,
        settings:     JSON.parse(row.settings),
        participants: []
      }
      lounges.push(rowLounge)
    }
    rowLounge.participants.push({ id: row.userId, name: row.name, image: row.image })
  }

  return lounges
}

export function leaveActiveLounge(targetUserId: string, loungeId: string):
  { ok: true; deletedLounge: boolean } | { ok: false; error: 'NOT_FOUND' } {
  const result = deleteActiveLoungeParticipant(targetUserId, targetUserId, loungeId)
  return result.deletedParticipant ?
         { ok: true, deletedLounge: result.deletedLounge } :
         { ok: false, error: 'NOT_FOUND' }
}