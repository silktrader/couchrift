import { betterAuth } from 'better-auth'
import { AUTH_PWD } from '@couchrift/shared'
import db from '../db'
import { createUserId } from './id'

export const auth = betterAuth({
  database:         db,
  user:             { modelName: 'users' },
  session:          { modelName: 'sessions' },
  account:          { modelName: 'accounts' },
  verification:     { modelName: 'verifications' },
  emailAndPassword: {
    enabled:           true,
    minPasswordLength: AUTH_PWD.MIN,
    maxPasswordLength: AUTH_PWD.MAX
  },
  advanced:         {
    database: {
      generateId: (options) => {
        // Generate custom short user IDs with Nanoid
        if (options.model === 'user' || options.model === 'users') {
          return createUserId()
        }
        // Let database auto-generate by default
        return false
      }
    }
  },
  // Add LAN devices to test auth
  trustedOrigins: ['http://localhost:5173', 'http://localhost:3000', 'http://192.168.1.102:5173'],
  secret:         process.env.BETTER_AUTH_SECRET,
  baseURL:        process.env.BETTER_AUTH_URL
})