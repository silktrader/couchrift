import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { runMigrations } from './migrate'

console.log('Initialising database ...')

// Attempt to read DB path from .env
const dbPath = process.env.DB_PATH
if (!dbPath) {
  console.error('✗ Could not load or create database: edit DB_PATH `.env` file.')
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
await runMigrations(db)

console.log('✓ Database initialized at:', dbPath)

export default db