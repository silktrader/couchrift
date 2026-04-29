import { createShortcode, createLoungeId } from '../lib/id'
import {
  addLounge, getActiveLoungeByCode, findActiveUserLounges, deleteLoungeParticipant, upsertLoungeParticipant,
  selectLoungeParticipant, deleteLounge, setLoungeStartWithInitialFilms, selectUnswipedFilms, getLoungeData,
  insertSwipe,
  getEndedLounge, getLoungeParticipants, getEndedLoungeMatches, getUserEndedLounges
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

export function getActiveLoungeByCodeAndUser(shortcode: string, userId: string) {
  const lounge = getActiveLoungeByCode(shortcode)
  if (!lounge) return fail('LOUNGE_MISSING')
  if (!lounge.participants.find(participant => participant.id === userId)) return fail('FORBIDDEN_ACCESS')
  return succeed(lounge)
}

// Get active lounges the user has joined or created.
export function getUserActiveLoungesWithDetails(userId: string) {
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

export function getEndedLoungeWithDetails(loungeId: string, userId: string) {
  // No transaction required as the state of ended lounges is frozen
  // Run separate queries without performance hits thanks to SQLite in-process nature
  const lounge = getEndedLounge(loungeId)
  if (!lounge) return fail('LOUNGE_MISSING')

  // Get participants and check user membership
  const participants = getLoungeParticipants(loungeId)
  if (!participants.some(p => p.id === userId)) return fail('FORBIDDEN_ACCESS')

  /// Get matches and check for existence
  const matches = getEndedLoungeMatches(loungeId)

  return succeed({
    ...lounge,
    participants: participants,
    matches:      matches
  })
}

// Fetch the specified `max` number of ended lounges, without read transactions (due to frozen state).
export function getUserEndedLoungesWithDetails(userId: string, max: number) {
  return getUserEndedLounges(userId, max).map(lounge => (
    {
      ...lounge,
      matches:      getEndedLoungeMatches(lounge.id),
      participants: getLoungeParticipants(lounge.id)
    })
  )
}