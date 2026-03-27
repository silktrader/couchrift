import { Elysia } from 'elysia'
import staticPlugin from '@elysiajs/static'
import path from 'node:path'

const isProd = process.env.NODE_ENV === 'production'

const app = new Elysia()
  .group('/api', (app) => app.get('/hello', () => ({ message: 'Hello from API' })))
  .use((app) => {
    if (isProd) {
      // Serve static files from the SvelteKit build directory
      // Fallback when no route matches, so that SvelteKit router takes over
      return app.use(staticPlugin({ assets: '../web/build', prefix: '/' }))
                .get('*', () => Bun.file(path.resolve('../web/build/index.html')))
    }
    return app
  })
  .listen(3000)

console.log(`Server running at ${app.server?.hostname}:${app.server?.port} (${isProd ? 'production' : 'development'})`)
