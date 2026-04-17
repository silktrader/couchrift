import { createShortcode, createLoungeId } from '../lib/id'
import {
  addLounge, findLoungeByCode, findActiveUserLounges, deleteActiveLoungeParticipant, upsertLoungeParticipant,
  selectLoungeParticipant
} from './lounge.repository'
import { Shortcode } from '@couchrift/shared/schemas/primitives'
import { LoungeResponse } from '@couchrift/shared/schemas/lounge'

export type CreateLoungeResult = { ok: true; shortcode: Shortcode } | { ok: false; error: 'DB_ERROR' }

export function createLounge(userId: string, settings: { maxDuration: number }):
  CreateLoungeResult {

  // Generate an ID and timestamp
  const loungeData = {
    id:        createLoungeId(),
    createdAt: Date.now(),
    creatorId: userId,
    settings:  settings,
    shortcode: createShortcode()
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
  const lounge = findLoungeByCode(shortcode, userId)
  if (!lounge) return { ok: false, error: 'NOT_FOUND' }
  return { ok: true, lounge }
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

export function removeActiveLoungeParticipant(participantId: string, requesterId: string, loungeId: string) {
  return deleteActiveLoungeParticipant(participantId, requesterId, loungeId)
}

// Allow the specified user to join a lounge that hasn't started yet.
export function joinLounge(userId: string, shortcode: string):
  { ok: true, loungeId: string, joined: boolean } | { ok: false, error: 'NOT_FOUND' | 'STARTED' } {
  return upsertLoungeParticipant(userId, shortcode)
}

export function getLoungeParticipant(userId: string, loungeId: string) {
  return selectLoungeParticipant(userId, loungeId)
}