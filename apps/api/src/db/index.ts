import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { runMigrations } from './migrate'

console.log('[DB] ⏳ Initialising database.')

// Attempt to read DB path from .env
const dbPath = process.env.DB_PATH
if (!dbPath) {
  console.error('[DB] ❌ DB_PATH is not set in `.env`.')
  process.exit(1)
}

// Attempt to create the DB directory when missing
mkdirSync(dirname(dbPath), { recursive: true })

const db = new Database(dbPath, { create: true, strict: true })

db.run('PRAGMA journal_mode = WAL') // allows concurrent reads
db.run('PRAGMA synchronous = NORMAL')
db.run('PRAGMA foreign_keys = ON')
db.run('PRAGMA temp_store = MEMORY') // store temporary structures in memory

// Run migrations
try {
  await runMigrations(db)
  console.log('[DB] ✅ Database initialised at:', dbPath)
} catch (error) {
  console.error('[DB] ❌ Failed to initialise database.')
  process.exit(1)
}

export default db