import { Elysia } from 'elysia'
import staticPlugin from '@elysiajs/static'
import path from 'node:path'
import { betterAuth } from './lib/auth-plugin'
import { userController } from './user/user.controller'
import { mkdir } from 'node:fs/promises'
import { AVATAR_CONFIG } from './user/user.service'
import { loungeController } from './lounge/lounge.controller'
import { loungeWsController } from './lounge/lounge.ws'
import { startTmdbIngestion } from './film/tmdb-ingestion.ts'

const isProd = process.env.NODE_ENV === 'production'

// Ensure avatar upload directory exists
try {
  await mkdir(AVATAR_CONFIG.uploadDir, { recursive: true })
} catch (error) {
  console.error('[INIT] ❌ Failed to create upload directory:', error)
}

const app = new Elysia()
  .use(staticPlugin({ assets: './uploads/avatars', prefix: '/uploads/avatars' }))
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
  // tk review grouping
  .use(userController)
  .use(loungeController)
  .use(loungeWsController)
  .listen({ port: 3000 })

console.log(`[INIT] 🔵 Server running at ${app.server?.hostname}:${app.server?.port} (${isProd ? 'prod' : 'dev'})`)

// Begin schedule TDMB ingestion checks and process after server initialisation
await startTmdbIngestion()

export type App = typeof app