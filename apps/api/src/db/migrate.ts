import { Database } from 'bun:sqlite'

const MIGRATIONS_DIR = Bun.env.NODE_ENV === 'production'
                       ? './migrations'
                       : `${import.meta.dir}/migrations`

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
  const glob = new Bun.Glob('*.sql')
  const files = await Array.fromAsync(glob.scan(MIGRATIONS_DIR))
  const pending = files.filter(f => !applied.has(f)).sort()

  if (pending.length === 0) {
    console.log('[DB] ✅ Migrations up to date.')
    return
  }

  // Ensure that each successful migration is applied and logged in a single transaction
  for (const filename of pending) {
    const sql = await Bun.file(`${MIGRATIONS_DIR}/${filename}`).text()
    const start = performance.now()
    try {
      db.transaction(() => {
        db.run(sql)
        db.run('INSERT INTO migrations (filename) VALUES (?)', [filename])
      })()
      console.log(`[DB] ✅ Migration applied: ${filename} (${(performance.now() - start).toFixed(1)}ms)`)
    } catch (error) {
      console.error(`[DB] ❌ Migration failed: ${filename}`)
      console.error(error)
      throw error // Re-throw to be caught by the caller
    }
  }
}