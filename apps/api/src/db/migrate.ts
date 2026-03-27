import { Database } from 'bun:sqlite'
import { join } from 'node:path'
import { readdir } from 'node:fs/promises'

const MIGRATIONS_DIR = join(import.meta.dir, 'migrations')

export const runMigrations = async (db: Database) => {
  db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
          filename  TEXT PRIMARY KEY,
          appliedAt INTEGER NOT NULL DEFAULT (unixepoch())
      )
  `)

  const applied = new Set(
    db.query<{ filename: string }, []>('SELECT filename FROM migrations')
      .all()
      .map(r => r.filename)
  )

  // Draft a list of unapplied, pending, migrations
  const pending = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql') && !applied.has(f)).sort()

  if (pending.length === 0) {
    console.log('✓ Database up to date')
    return
  }

  // Ensure that each successful migration is applied and logged in a single transaction
  for (const filename of pending) {
    const sql = await Bun.file(join(MIGRATIONS_DIR, filename)).text()
    db.transaction(() => {
      db.run(sql)
      db.run('INSERT INTO migrations (filename) VALUES (?)', [filename])
    })()
    console.log(`✓ Applied: ${filename}`)
  }
}