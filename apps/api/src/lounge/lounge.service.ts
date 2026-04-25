import { createShortcode, createLoungeId } from '../lib/id'
import {
  addLounge, findLoungeByCode, findActiveUserLounges, deleteLoungeParticipant, upsertLoungeParticipant,
  selectLoungeParticipant, deleteLounge, setLoungeStartWithInitialFilms, selectUnswipedFilms, getLoungeData, insertSwipe
} from './lounge.repository'
import type { Shortcode } from '@couchrift/shared/schemas/primitives'
import type { LoungeResponse } from '@couchrift/shared/schemas/lounge'
import { fail, succeed } from '@couchrift/shared/utilities'
import type { AddSwipeData } from './lounge.models.ts'
import { getFilmDetails } from '../film/film.repository.ts'
import { broadcastLoungeMatch } from './lounge.ws.ts'

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

export function removeLounge(loungeId: string, requesterId: string) {
  return deleteLounge(loungeId, requesterId)
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

export function removeLoungeParticipant(participantId: string, requesterId: string, loungeId: string) {
  return deleteLoungeParticipant(participantId, requesterId, loungeId)
}

// Allow the specified user to join a lounge that hasn't started yet.
export function joinLounge(userId: string, shortcode: string):
  { ok: true, loungeId: string, joined: boolean } | { ok: false, error: 'NOT_FOUND' | 'STARTED' } {
  return upsertLoungeParticipant(userId, shortcode)
}

export function getLoungeParticipant(userId: string, loungeId: string) {
  return selectLoungeParticipant(userId, loungeId)
}

export function startLounge(loungeId: string, creatorId: string) {
  // TODO: Export film per participant
  return setLoungeStartWithInitialFilms(loungeId, creatorId, 30)
}

export function getUnswipedFilms(loungeId: string, userId: string) {
  // Check lounge state but don't start a transaction.
  // The early exits allow to distinguish between cases when a lounge film refill is or isn't needed.
  const lounge = getLoungeData(loungeId)

  if (!lounge) return fail('LOUNGE_MISSING')
  if (lounge.startedAt === null) return fail('LOUNGE_NOT_STARTED')
  if (lounge.endedAt) return fail('LOUNGE_ENDED')
  if (!lounge.participantIds.includes(userId)) return fail('FORBIDDEN_ACCESS')

  // Determine how many films to fetch (based on settings, or client request)
  // TODO: Export or derive quantity.
  const needed = 15

  // Get randomly ordered lounge films the user hasn't swiped yet.
  const unswipedFilms = selectUnswipedFilms(loungeId, userId, needed)

  // Trigger a new film ingestion when there are fewer lounge films than needed
  if (unswipedFilms.length === 0) return fail('FILMS_PENDING')

  // TODO: Check the length of the films cache for next requests.
  // TODO: Trigger cache refill when the remaining films are fewer than X.

  // Return however many films are available
  return succeed(unswipedFilms)
}

export function saveSwipe(data: AddSwipeData) {

  // Insert the swipe or fail
  const result = insertSwipe(data)
  if (!result.ok) return fail(result.error)

  // Check whether the swipe triggers a match and fetch details
  if (result.data.match) {
    const film = getFilmDetails(data.filmId)
    // possible path when swipes outlive the films they reference
    // TODO: add DB constraint
    if (!film) throw new Error('Match detected but film not found.')
    broadcastLoungeMatch(data.loungeId, film)
  }

  return succeed()
}