import { Elysia } from 'elysia'
import { betterAuth } from '../lib/auth-plugin.ts'
import { getGenres } from './film.repository.ts'

export const filmController = new Elysia()
  .use(betterAuth)
  .get('/api/genres', async () => {
    return { genres: getGenres() }
  }, {
    auth: true
  })