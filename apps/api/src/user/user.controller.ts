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
      if (result.ok) return { fileName: result.data }

      switch (result.error) {
        case 'WRITE_ERROR':
          return status(500, { message: 'Write error' })
        case 'CONVERSION_ERROR':
          return status(415, { message: 'Conversion error' })
        case 'UPDATE_ERROR':
          return status(500, { message: 'Update error' })

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
  // Matches any uploaded avatar regardless of when it was created, gets around the /* catchall
  .get('/avatars/:filename', async ({ params, status }) => {
    const file = Bun.file(`${AVATAR_CONFIG.uploadDir}/${params.filename}`)
    if (!(await file.exists()))
      return status(404)
    return file
  })