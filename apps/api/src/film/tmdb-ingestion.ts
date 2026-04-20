import { getOldestGenreUpdate, insertGenres, insertFilm, countFilms } from './film.repository'
import { TMDB } from './tmdb-config'
import type { TmdbGenre, TmdbFilmDiscover, TmdbFilmData, TmdbDiscoverResponse } from './film.models'
import { fail, succeed } from '@couchrift/shared/utilities'
import { safeFetch } from '../lib/safe-fetch.ts'

export async function startTmdbIngestion() {

  // Ensure initial checks to seed data for new setups
  await maybeSyncGenres()
  await maybeIngestFilms()

  // Schedule an infrequent check for genres update.
  // TMDB's genre updates are very infrequent.
  Bun.cron('@weekly', async () => {
    await maybeSyncGenres()
  })

  // Schedule a film ingestion every 10th minute, when below target.
  Bun.cron('*/10 * * * *', async () => {
    await maybeIngestFilms()
  })
}

async function maybeSyncGenres() {
  // Check for the earliest updated genre
  const oldestUpdate = getOldestGenreUpdate()

  // Run the genres update when the table is empty or the oldest update is stale
  if (!oldestUpdate?.timestamp || oldestUpdate.timestamp < (Date.now() - TMDB.GENRE_UPDATE_INTERVAL)) {
    await updateGenres()
  }
}

async function maybeIngestFilms() {
  const count = countFilms()
  if (count < TMDB.TARGET_FILM_COUNT)
    await ingestTmdbFilms()
}

async function updateGenres() {
  console.log('[TMDB] ⏳ Updating genres.')

  const result = await fetchGenres()
  if (result.ok) {
    insertGenres(result.genres)
    console.log('[TMDB] ✅ Updated genres.')
    return
  }

  switch (result.error) {
    case 'NO_GENRES_FOUND':
      console.error('[TMDB] ❌ No genres received from TMDB.')
      return
    case 'HTTP_ERROR':
      console.error(`[TMDB] ❌ HTTP error while fetching genres: ${result.details}`)
      return
    default:
      console.error(`[TMDB] ❌ ${ERRORS[result.error]} while fetching genres.`)
  }
}

async function fetchGenres() {
  const response = await safeFetch<{ genres: TmdbGenre[] }>(`${TMDB.BASE_URL}/genre/movie/list`, {
      headers: { Authorization: `Bearer ${TMDB.API_KEY}` },
      signal:  AbortSignal.timeout(10000)
    }
  )

  if (response.ok) {
    const { genres } = response.data
    if (genres.length === 0) return fail('NO_GENRES_FOUND')
    return succeed({ genres })
  }

  // Error passthrough
  return response
}

async function ingestTmdbFilms() {

  // Fetch TMDB films from a random page with a randomised order selection
  const pageResponse = await fetchRandomPage()
  if (!pageResponse.ok) {
    const errorMessage = pageResponse.error === 'HTTP_ERROR' ?
                         `[TMDB] ❌ HTTP error fetching random film page: ${pageResponse.details}` :
                         `[TMDB] ❌ ${ERRORS[pageResponse.error]} fetching random film page.`
    console.error(errorMessage)
    return
  }
  const randomFilms = pageResponse.data.results
  console.log(`[TMDB] ✅ Fetched ${randomFilms.length} films.`)

  // Removes inadequate films (i.e. adult ones) or ones with insufficient data (poster)
  const filteredFilms = randomFilms.filter((film: TmdbFilmDiscover) =>
    film.poster_path &&
    !film.adult &&
    film.vote_average > 4)
  console.log(`[TMDB] ✅ Filtered ${filteredFilms.length} out of ${randomFilms.length} fetched ones.`)

  // Fetch films details and store in DB
  let addedFilms = 0
  for (const film of filteredFilms) {
    // Fetch TMDB film
    const filmResponse = await fetchFilm(film.id)
    if (!filmResponse.ok) {
      console.error(`[TMDB] ❌ Error downloading TMDB film data (${film.id}).`)
      continue
    }

    // Attempt to store the film
    try {
      insertFilm(filmResponse.data)
      addedFilms += 1
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[TMDB] ❌ DB error inserting TMDB film (${film.id}): ${errorMessage}`)
    }
  }

  console.log(`[TMDB] ✅ Added or updated ${addedFilms} new films.`)
}

// Return a random page filled with films according to randomly chosen and variable film parameters
async function fetchRandomPage() {
  const pageNumber = Math.floor(Math.random() * (TMDB.MAX_PAGE - 1))

  // Build the URL with random parameters
  const url = new URL(`${TMDB.BASE_URL}/discover/movie`)
  url.searchParams.set('sort_by', 'vote_count.desc')
  url.searchParams.set('vote_count.gte', '50')    // tk export
  url.searchParams.set('with_runtime.gte', '60') // tk export
  url.searchParams.set('page', String(pageNumber))

  // Issue the request
  return await safeFetch<TmdbDiscoverResponse>(url.toString(), {
    headers: { Authorization: `Bearer ${TMDB.API_KEY}` },
    signal:  AbortSignal.timeout(10000)
  })
}

async function fetchFilm(id: number) {
  return await safeFetch<TmdbFilmData>(`${TMDB.BASE_URL}/movie/${id}`, {
    headers: { Authorization: `Bearer ${TMDB.API_KEY}` },
    signal:  AbortSignal.timeout(5000)
  })
}

const ERRORS: Record<string, string> = {
  NETWORK: 'Network error',
  TIMEOUT: 'Timeout error',
  UNKNOWN: 'Unknown error',
  JSON:    'JSON parsing error'
}
