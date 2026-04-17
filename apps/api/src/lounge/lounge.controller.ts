import { Elysia, t } from 'elysia'
import { betterAuth } from '../lib/auth-plugin'
import {
  createLounge, getActiveLoungeByCode, getActiveUserLounges, joinLounge,
  removeLoungeParticipant
} from './lounge.service'
import { LoungeCreateSchema } from '@couchrift/shared/schemas/lounge'
import { broadcastUserJoined, broadcastUserLeft, broadcastUserRemoved } from './lounge.ws'
import { ShortcodeSchema, LoungeIdSchema, UserIdSchema } from '@couchrift/shared/schemas/primitives'

export const loungeController = new Elysia()
  .use(betterAuth)

  // Create lounge
  .post('/api/lounges', async ({ user, body, status }) => {

    const result = createLounge(user.id, body.settings)
    if (result.ok) return { shortcode: result.shortcode }

    switch (result.error) {
      case 'DB_ERROR':
        return status(500, { message: 'Failed to create lounge' })
      default:
        return status(500, { message: 'Unknown error' })
    }
  }, {
    auth: true,
    body: LoungeCreateSchema
  })

  // Fetch lounge data by shortcode
  .get('/api/lounges/active/:shortcode', async ({ user, status, params: { shortcode } }) => {
    const result = getActiveLoungeByCode(shortcode, user.id)
    if (!result.ok) return status(404)

    // Ensure that the user is a participant
    const isParticipant = result.lounge.participants.find(part => user.id === part.id)
    if (!isParticipant) return status(401)

    return result.lounge
  }, {
    auth:   true,
    params: t.Object({ shortcode: ShortcodeSchema })
  })

  // Get user's active lounges
  .get('/api/me/lounges/active', async ({ user }) => {
    return { lounges: getActiveUserLounges(user.id) }
  }, {
    auth: true
  })

  // Remove participant from lounge either by KICKING or voluntary LEAVING
  .delete('/api/lounges/:loungeId/participants/:participantId',
    async ({ user, status, params: { loungeId, participantId } }) => {
      const result = removeLoungeParticipant(participantId, user.id, loungeId)
      if (result.ok) {
        if (user.id === participantId)
          broadcastUserLeft(loungeId, { id: user.id, name: user.name })
        else
          broadcastUserRemoved(loungeId, result.user)
        return status(204)
      }

      switch (result.error) {
        case 'LOUNGE_NOT_FOUND':
          return status(404, { type: result.error })
        case 'LOUNGE_ENDED':
          return status(409, { type: result.error })
        case 'CREATOR_CANT_LEAVE':
          return status(403, { type: result.error })
        case 'CANT_KICK_USER':
          return status(403, { type: result.error })
        case 'PARTICIPANT_NOT_FOUND':
          return status(404, { type: result.error })
      }
    },
    {
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