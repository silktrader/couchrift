import { Elysia } from 'elysia'
import staticPlugin from '@elysiajs/static'
import path from 'node:path'
import { auth } from './lib/auth'

const isProd = process.env.NODE_ENV === 'production'

const betterAuth = new Elysia({ name: 'better-auth' })
  .mount('/auth', auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers
        })

        if (!session) return status(401)

        return {
          user:    session.user,
          session: session.session
        }
      }
    }
  })

const app = new Elysia()
  .use((app) => {
    if (isProd) {
      // Serve static files from the SvelteKit build directory
      // Fallback when no route matches, so that SvelteKit router takes over
      return app.use(staticPlugin({ assets: '../web/build', prefix: '/' }))
                .get('*', () => Bun.file(path.resolve('../web/build/index.html')))
    }
    return app
  })
  .use(betterAuth)
  .group('/api', (app) => app.get('/hello', () => ({ message: 'Hello from API' })))
  .listen(3000)

console.log(`Server running at ${app.server?.hostname}:${app.server?.port} (${isProd ? 'production' : 'development'})`)
