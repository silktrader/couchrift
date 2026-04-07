import { Elysia, t } from 'elysia'
import { betterAuth } from '../lib/auth-plugin'
import { createLounge } from './lounge.service'
import { LoungeCreateSchema } from '@couchrift/shared/schemas/lounge'

export const loungeController = new Elysia()
  .use(betterAuth)
  .post('/api/lounges',
    async ({ user, body, status }) => {
      const result = createLounge(user.id, user.name, body.settings)

      if (result.ok)
        return status(200, result.lounge)

      switch (result.error) {
        case 'DB_ERROR':
          return status(500, { message: 'Failed to create lounge' })
        default:
          return status(500, { message: 'Unknown error' })
      }
    },
    {
      auth: true,
      body: LoungeCreateSchema
    }
  )