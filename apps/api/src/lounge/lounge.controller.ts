import { Elysia, t } from 'elysia'
import { betterAuth } from '../lib/auth-plugin'
import {
  createLounge, getActiveLoungeByCode, getActiveUserLounges, leaveActiveLounge, joinLounge
} from './lounge.service'
import { LoungeCreateSchema } from '@couchrift/shared/schemas/lounge'

export const loungeController = new Elysia()
  .use(betterAuth)
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
  .get('/api/lounges/active/:shortcode', async ({ user, status, params: { shortcode } }) => {
    const result = getActiveLoungeByCode(shortcode, user.id)
    if (!result.ok) return status(404)

    // Ensure that the user is a participant
    const isParticipant = result.lounge.participants.find(part => user.id === part.id)
    if (!isParticipant) return status(401)

    return result.lounge
  }, {
    auth: true
  })
  .get('/api/me/lounges/active', async ({ user }) => {
    return { lounges: getActiveUserLounges(user.id) }
  }, {
    auth: true
  })
  .delete('/api/me/lounges/active/:loungeId', async ({ user, status, params: { loungeId } }) => {
    const result = leaveActiveLounge(user.id, loungeId)
    if (result.ok) return { deletedLounge: result.deletedLounge }

    switch (result.error) {
      case 'NOT_FOUND':
        return status(404, { message: 'Lounge not found' })
    }
  }, { auth: true })
  .post('/api/lounges/waiting/:shortcode/participants', async ({ user, status, params: { shortcode } }) => {

    const result = joinLounge(user.id, shortcode)
    if (result.ok) return { joined: result.joined }

    switch (result.error) {
      case 'NOT_FOUND':
        return status(404, { message: 'Lounge not found' })
      case 'STARTED':
        return status(409, { message: 'Lounge already started' })
    }
  }, {
    auth: true
  })