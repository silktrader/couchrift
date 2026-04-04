import { Elysia, t } from 'elysia'
import { AVATAR_CONFIG, addAvatar } from './user.service'
import { betterAuth } from '../lib/auth-plugin'

// Avatar upload endpoint
export const userController = new Elysia()
  .use(betterAuth)
  .post('/api/users/me/avatar',
    async ({ user, body, status }) => {
      // Update user record in database with new avatar URL
      const result = await addAvatar(body.avatar, user.id)

      if (result.ok) {
        return status(200, { fileName: result.fileName })
      }

      switch (result.error) {
        case 'CONVERSION_ERROR':
          return status(415, { message: 'Conversion error' })
        case 'UPDATE_ERROR':
          return status(500, { message: 'Update error' })
        default:
          return status(500, { message: 'Unknown error' })
      }
    }, {
      auth: true,
      body: t.Object({
        avatar: t.File({
          type:    ['image/png', 'image/jpeg'],
          minSize: 10000,
          maxSize: AVATAR_CONFIG.maxSize
        })
      })
    })