import {Elysia, t} from 'elysia'
import {
  AVATAR_CONFIG,
  addAvatar,
  getUserData,
  addFriendRequest,
  getUserFriendRequests,
  declineFriendRequest
} from './user.service'
import {betterAuth} from '../lib/auth-plugin'
import {FriendRequestIdSchema, UserIdSchema} from "@couchrift/shared/schemas/primitives.ts";


const codes = {
  USER_MISSING: 404,
  RECIPIENT_INVALID: 400,
  RECIPIENT_ALREADY_BEFRIENDED: 400,
  FRIEND_REQUEST_MISSING: 404
} as const

export const userController = new Elysia()
  .use(betterAuth)
  .post('/api/users/me/avatar',
    async ({user, body, status}) => {
      // Update user record in database with new avatar URL
      const result = await addAvatar(body.avatar, user.id)
      if (result.ok) return {fileName: result.data}

      switch (result.error) {
        case 'WRITE_ERROR':
          return status(500, {message: 'Write error'})
        case 'CONVERSION_ERROR':
          return status(415, {message: 'Conversion error'})
        case 'UPDATE_ERROR':
          return status(500, {message: 'Update error'})

      }
    }, {
      auth: true,
      body: t.Object({
        avatar: t.File({
          type: ['image/png', 'image/jpeg'],
          minSize: 10000,
          maxSize: AVATAR_CONFIG.maxSize
        })
      })
    })

  // Matches any uploaded avatar regardless of when it was created, gets around the /* catchall
  .get('/avatars/:filename', async ({params, status}) => {
    const file = Bun.file(`${AVATAR_CONFIG.uploadDir}/${params.filename}`)
    if (!(await file.exists()))
      return status(404)
    return file
  })

  // Fetch user details
  .get('/api/users/:id', async ({user, params, status}) => {
    const result = getUserData(params.id, user.id)
    if (result.ok) return {details: result.data}
    return status(codes[result.error], {type: result.error})
  }, {
    auth: true,
    params: t.Object({id: UserIdSchema})
  })

  // Fetch friend requests
  .get('/api/users/me/friend_requests', async ({user}) => {
    return getUserFriendRequests(user.id)
  }, {
    auth: true
  })

  // Decline received friend requests
  .delete('/api/users/me/friend_requests/:id', async ({user, params, status}) => {
    const result = declineFriendRequest(params.id, user.id)
    if (result.ok) return status(204)
    return status(codes[result.error], {type: result.error})
  }, {
    auth: true,
    params: t.Object({id: FriendRequestIdSchema})
  })

  // Add a friend request
  .post('/api/users/:id/friend_requests', ({user, params, status}) => {
    const result = addFriendRequest(user.id, params.id)
    if (result.ok) return {request: result.data}
    return status(codes[result.error], {type: result.error})
  }, {
    auth: true,
    params: t.Object({id: UserIdSchema})
  })