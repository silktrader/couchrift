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
  // When requests hit the backend, BetterAuth can verify session data
  // from the incoming cookie token without hitting the database.
  cookieCache: {
    enabled: true,
    maxAge:  5 * 60 // Cache duration in seconds
  },
  advanced:    {
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
  // Allows Better Auth to play along with NGINX
  trustedProxyHeaders: true,
  // Add LAN devices to test auth
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
  secret:         process.env.BETTER_AUTH_SECRET,
  baseURL:        process.env.BETTER_AUTH_URL
})