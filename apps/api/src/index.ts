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
import { filmController } from './film/film.controller.ts'
import { userWsController } from './lounge/user-ws.controller.ts'

const isProd = process.env.NODE_ENV === 'production'

// Ensure avatar upload directory exists
try {
  await mkdir(AVATAR_CONFIG.uploadDir, { recursive: true })
} catch (error) {
  console.error('[INIT] ❌ Failed to create upload directory:', error)
}

// Serve static files from the SvelteKit build directory.
// Fallback when no route matches, so that SvelteKit router takes over.
function withSpaFallback(app: Elysia) {
  return isProd
         ? app
           .use(staticPlugin({ assets: '../web/build', prefix: '/' }))
           .get('*', () => Bun.file(path.resolve('../web/build/index.html')))
         : app
}

const app = new Elysia()
  .get('/health', ({ status }) => status(204))
  .use(staticPlugin({ assets: './uploads/avatars', prefix: '/uploads/avatars' }))
  .use(betterAuth)
  .use(userController)
  .use(filmController)
  .use(loungeController)
  .use(loungeWsController)
  .use(userWsController)
  .use(withSpaFallback) // Registered last as a catch-all fallback
  .listen({ port: 3000, hostname: '0.0.0.0' })

console.log(`[INIT] 🔵 Server running at ${app.server?.hostname}:${app.server?.port} (${isProd ? 'prod' : 'dev'})`)

// Begin schedule TDMB ingestion checks and process after server initialisation
await startTmdbIngestion()

export type App = typeof app