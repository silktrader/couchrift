import { Elysia, t } from 'elysia'
import { betterAuth } from '../lib/auth-plugin'
import {
  createLounge, getActiveLoungeByCodeAndUser, getUserActiveLoungesWithDetails, joinLounge,
  removeLoungeParticipant, removeLounge, startLounge, getUnswipedFilms, saveSwipe,
  getEndedLoungeWithDetails, getUserEndedLoungesWithDetails, updateLoungeSettings
} from './lounge.service'
import { LoungeCreateSchema, LoungeSettingsSchema } from '@couchrift/shared/schemas/lounge'
import {
  broadcastUserJoined, broadcastUserLeft, broadcastUserRemoved, broadcastLoungeRemoved, broadcastLoungeStarted,
  broadcastLoungeSettingsUpdate
} from './lounge.ws'
import { ShortcodeSchema, LoungeIdSchema, UserIdSchema, FilmIdSchema } from '@couchrift/shared/schemas/primitives'

export const loungeController = new Elysia()
  .use(betterAuth)

  // Create lounge
  .post('/api/lounges', async ({ user, body, status }) => {

    const result = createLounge(user.id, body.settings)
    if (result.ok) return { shortcode: result.shortcode }

    if (result.error === 'DB_ERROR') {
      return status(500, { message: 'Failed to create lounge' })
    } else {
      return status(500, { message: 'Unknown error' })
    }
  }, {
    auth: true,
    body: LoungeCreateSchema
  })

  // Change lounge settings
  .put('/api/lounges/:loungeId/settings', async ({ user, body, status, params: { loungeId } }) => {
    const result = updateLoungeSettings(user.id, loungeId, body)
    if (result.ok) {
      broadcastLoungeSettingsUpdate(loungeId, body)
      return status(204)
    }

    const code = {
      LOUNGE_MISSING:   404,
      LOUNGE_STARTED:   400,
      FORBIDDEN_ACCESS: 403
    } as const

    return status(code[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ loungeId: LoungeIdSchema }),
    body:   LoungeSettingsSchema
  })

  // Delete lounge
  .delete('/api/lounges/:loungeId', async ({ user, status, params: { loungeId } }) => {

    const result = removeLounge(loungeId, user.id)
    if (result.ok) {
      broadcastLoungeRemoved(loungeId)
      return status(204)
    }

    const codes = {
      LOUNGE_MISSING: 404,
      NOT_CREATOR:    403,
      LOUNGE_ENDED:   409
    } as const

    return status(codes[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ loungeId: LoungeIdSchema })
  })

  // Fetch completed lounges by ID
  .get('/api/lounges/ended/:id', async ({ user, status, params: { id } }) => {
    const result = getEndedLoungeWithDetails(id, user.id)
    if (result.ok) return { lounge: result.data }

    const code = {
      LOUNGE_MISSING:   404,
      FORBIDDEN_ACCESS: 403
    } as const

    return status(code[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ id: LoungeIdSchema })
  })

  // Fetch lounge data by shortcode
  .get('/api/lounges/active/:shortcode', async ({ user, status, params: { shortcode } }) => {
    const result = getActiveLoungeByCodeAndUser(shortcode, user.id)
    if (result.ok) return { lounge: result.data }

    const code = {
      LOUNGE_MISSING:   404,
      FORBIDDEN_ACCESS: 403
    } as const

    return status(code[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ shortcode: ShortcodeSchema })
  })

  // Get the user's active lounges
  .get('/api/me/lounges/active', async ({ user }) => {
    return { lounges: getUserActiveLoungesWithDetails(user.id) }
  }, {
    auth: true
  })

  // Get the user's ended lounges
  .get('/api/me/lounges/ended', async ({ user, query: { max } }) => {
    return { endedLounges: getUserEndedLoungesWithDetails(user.id, max) }
  }, {
    auth:  true,
    query: t.Object({ max: t.Integer({ minimum: 0 }) })
  })

  // Get the user's lounges, both active and ended
  .get('/api/me/lounges', async ({ user, query: { max } }) => {
    return {
      lounges: {
        active: getUserActiveLoungesWithDetails(user.id),
        ended:  getUserEndedLoungesWithDetails(user.id, max)
      }
    }
  }, {
    auth:  true,
    query: t.Object({ max: t.Integer({ minimum: 0 }) })
  })

  // Start a lounge and the film selection process
  .post('/api/lounges/:loungeId/start', async ({ user, status, params: { loungeId } }) => {

    const result = startLounge(loungeId, user.id)
    if (result.ok) {
      broadcastLoungeStarted(loungeId, result.data)
      return status(204)
    }

    const codes = {
      UNAUTHORISED:         401,
      LOUNGE_STARTED:       400,
      LOUNGE_MISSING:       404,
      PARTICIPANTS_MISSING: 404,
      FILMS_MISSING:        404
    } as const

    return status(codes[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ loungeId: LoungeIdSchema })
  })

  // Return lounge cached films that weren't swiped by the user
  .get('api/lounges/:loungeId/films/unswiped/me', async ({ user, status, params: { loungeId } }) => {

    // TODO: Validate `needed` parameter if introduced
    const result = getUnswipedFilms(loungeId, user.id)
    if (result.ok) return { unswipedFilms: result.data }

    const codes = {
      FILMS_PENDING:      503,
      LOUNGE_ENDED:       409,
      LOUNGE_NOT_STARTED: 409,
      LOUNGE_MISSING:     404,
      FORBIDDEN_ACCESS:   403
    } as const

    return status(codes[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ loungeId: LoungeIdSchema })
  })

  // Remove participant from lounge either by KICKING or voluntary LEAVING
  .delete('/api/lounges/:loungeId/participants/:participantId',
    async ({ user, status, params: { loungeId, participantId } }) => {
      const result = removeLoungeParticipant(participantId, user.id, loungeId)
      if (result.ok) {
        if (user.id === participantId)
          broadcastUserLeft(loungeId, result.data)
        else
          broadcastUserRemoved(loungeId, result.data)
        return status(204)
      }

      const codes = {
        LOUNGE_ENDED:    409,
        LOUNGE_MISSING:  404,
        USER_MISSING:    404,
        FORBIDDEN_KICK:  403,
        FORBIDDEN_LEAVE: 403
      } as const

      return status(codes[result.error], { type: result.error })
    }, {
      auth:   true,
      params: t.Object({ loungeId: LoungeIdSchema, participantId: UserIdSchema })
    })

  // Join lounge
  .post('/api/lounges/waiting/:shortcode/participants', async ({ user, status, params: { shortcode } }) => {

    const result = joinLounge(user.id, shortcode)
    if (result.ok) {
      if (result.joined) broadcastUserJoined(result.loungeId, user)
      return { joined: result.joined }
    }

    switch (result.error) {
      case 'NOT_FOUND':
        return status(404)
      case 'STARTED':
        return status(409)
    }
  }, {
    auth:   true,
    params: t.Object({ shortcode: ShortcodeSchema })
  })

  // Register swipes
  .post('/api/lounges/:loungeId/swipes', async ({ user, status, body, params: { loungeId } }) => {

    const result = saveSwipe({ loungeId, userId: user.id, ...body })
    if (result.ok) return status(204)

    const codes = {
      LOUNGE_MISSING:   404,
      LOUNGE_ENDED:     409,
      LOUNGE_UNSTARTED: 409,
      FORBIDDEN_SWIPE:  403,
      ALREADY_SWIPED:   409
    } as const

    return status(codes[result.error], { type: result.error })
  }, {
    auth:   true,
    params: t.Object({ loungeId: LoungeIdSchema }),
    body:   t.Object({ filmId: FilmIdSchema, like: t.Boolean() })
  })
