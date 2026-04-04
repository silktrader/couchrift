import { Elysia } from 'elysia'
import staticPlugin from '@elysiajs/static'
import path from 'node:path'
import { betterAuth } from './lib/auth-plugin'
import { userController } from './user/user.controller'
import { mkdir } from 'node:fs/promises'
import { AVATAR_CONFIG } from './user/user.service'

const isProd = process.env.NODE_ENV === 'production'

// Ensure avatar upload directory exists
try {
  await mkdir(AVATAR_CONFIG.uploadDir, { recursive: true })
} catch (error) {
  console.error('Failed to create upload directory:', error)
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
  .use(userController)
  .listen(3000)

console.log(`Server running at ${app.server?.hostname}:${app.server?.port} (${isProd ? 'production' : 'development'})`)
