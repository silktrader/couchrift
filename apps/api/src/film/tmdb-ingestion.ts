import { getOldestGenreUpdate, insertGenres } from './film.repository'
import { TMDB } from './tmdb-config'
import type { TmdbGenre } from './film.models'

const GENRE_UPDATE_INTERVAL = 15_552_000 // about six months

export async function startTmdbIngestion() {

  await maybeSyncGenres()
  Bun.cron('@weekly', async () => {
    await maybeSyncGenres()
  })
}

async function maybeSyncGenres() {
  // Check for the earliest updated genre
  const oldestUpdate = getOldestGenreUpdate()
  const now = Math.floor(Date.now() / 1000)

  // Run the genres update when the table is empty or the oldest update is stale
  if (!oldestUpdate?.timestamp || oldestUpdate.timestamp < (now - GENRE_UPDATE_INTERVAL)) {
    await updateGenres()
  }
}

async function updateGenres() {
  console.log('[TMDB] ⏳ Updating genres.')

  try {
    // Protects against hangs due to network or upstream issues.
    const signal = AbortSignal.timeout(10000)
    const response = await fetch(`${TMDB.BASE_URL}/genre/movie/list`, {
        headers: {
          Authorization: `Bearer ${TMDB.API_KEY}`
        },
        signal
      }
    )

    if (!response.ok) {
      console.error(`[TMDB] ❌ Failed to fetch TMDB genres: ${response.statusText}`)
      return
    }

    const { genres } = await response.json() as { genres: TmdbGenre[] }

    if (genres.length === 0) {
      console.error('[TMDB] ❌ No genres received from TMDB.')
      return
    }

    insertGenres(genres)
    console.log('[TMDB] ✅ Updated genres.')
  } catch (error) {
    console.error('[TMDB] ❌ Genres update failed:', error)
  }
}