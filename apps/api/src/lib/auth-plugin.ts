import { Elysia } from 'elysia'
import { auth } from './auth'

export const betterAuth = new Elysia({ name: 'better-auth' })
  //.all('/api/auth/*', ({ request }) => auth.handler(request))
  .get('/api/auth/*', ({ request }) => auth.handler(request))
  .post('/api/auth/*', ({ request }) => auth.handler(request))
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers
        })

        if (!session) return status(401, { type: 'UNAUTHORIZED' })

        return {
          user:    session.user,
          session: session.session
        }
      }
    }
  })
