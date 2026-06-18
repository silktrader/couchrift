import { Elysia } from 'elysia'
import staticPlugin from '@elysiajs/static'
import { betterAuth } from './lib/auth-plugin'
import { userController } from './user/user.controller'
import { loungeController } from './lounge/lounge.controller'
import { loungeWsController } from './lounge/lounge.ws'
import { startTmdbIngestion } from './film/tmdb-ingestion.ts'
import { filmController } from './film/film.controller.ts'
import { userWsController } from './lounge/user-ws.controller.ts'

const isProd = Bun.env.NODE_ENV === 'production'

// Serve static files from the SvelteKit build directory.
// Fallback when no route matches, so that SvelteKit router takes over.
function withSpaFallback(app: Elysia) {
  const assetsDir = process.env.STATIC_ASSETS_PATH
  const indexHtmlPath = `${assetsDir}/index.html`

  return isProd
         ? app
           .use(staticPlugin({ assets: assetsDir, prefix: '/' }))
           .get('/*', () => Bun.file(indexHtmlPath))
         : app
}

const app = new Elysia()
  .get('/health', () => 'ok')
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