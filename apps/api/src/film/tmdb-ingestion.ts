import {
  getOldestGenreUpdate, insertGenres, insertFilm, countFilms, getExistingFilmIds
} from './film.repository'
import { TMDB } from './tmdb-config'
import type { TmdbGenre, TmdbFilmDiscover, TmdbFilmData, TmdbDiscoverResponse } from './film.models'
import { fail, succeed } from '@couchrift/shared/utilities'
import { safeFetch } from '../lib/safe-fetch.ts'
import type { PersonRole } from '@couchrift/shared/schemas/tmdbFilm.ts'
import { filmConfig } from '@couchrift/shared/config/film.ts'

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
    insertGenres(result.data.genres)
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

  // Removes inadequate films (i.e. adult ones) or ones with insufficient data (poster)
  const filteredFilms = pageResponse.data.results.filter((film: TmdbFilmDiscover) =>
    film.poster_path &&
    !film.adult &&
    film.vote_average > 4)
  console.log(`[TMDB] ✅ Fetched random page containing ${filteredFilms.length} films.`)

  // Shorten the list of films to fetch by removing the ones already present in the DB
  const existingFilms = getExistingFilmIds(filteredFilms.map(f => f.id))
  const existingIds = new Set<number>(existingFilms.map(f => f.id))
  const missingFilms = filteredFilms.filter(film => !existingIds.has(film.id))

  if (missingFilms.length === 0) {
    console.log(`[TMDB] ⏩ No new films found on random page.`)
    return
  }

  // Fetch films details and store in DB
  let addedFilms = 0
  console.log(`[TMDB] ⏳ Fetching the details of ${missingFilms.length} films.`)

  for (const film of missingFilms) {
    // Fetch TMDB film
    const filmResponse = await fetchFilm(film.id)
    if (!filmResponse.ok) {
      console.error(`[TMDB] ❌ Error downloading film data (${film.id}).`)
      continue
    }

    const extraction = extractFilmData(filmResponse.data)
    if (!extraction.ok) {
      console.error(`[TMDB] ❌ Error extracting film data (${film.id}): ${extraction.error}`)
      continue
    }

    // Attempt to store the film
    try {
      insertFilm(extraction.data)
      addedFilms += 1
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[TMDB] ❌ DB error inserting TMDB film (${film.id}): ${errorMessage}`)
    }
  }

  console.log(`[TMDB] ✅ Added ${addedFilms} new films.`)
}

// Return a random page filled with films according to randomly chosen and variable film parameters
async function fetchRandomPage() {
  const pageNumber = Math.min(Math.floor(Math.random() * (TMDB.MAX_PAGE - 1)), 1)

  // Build the URL with random parameters
  const url = new URL(`${TMDB.BASE_URL}/discover/movie`)
  url.searchParams.set('sort_by', 'vote_count.desc')
  url.searchParams.set('vote_count.gte', '30')    // tk export
  url.searchParams.set('with_runtime.gte', '60') // tk export
  url.searchParams.set('page', String(pageNumber))

  // Issue the request
  return await safeFetch<TmdbDiscoverResponse>(url.toString(), {
    headers: { Authorization: `Bearer ${TMDB.API_KEY}` },
    signal:  AbortSignal.timeout(10000)
  })
}

// Fetch film details and credits with one single request
async function fetchFilm(id: number) {
  return await safeFetch<TmdbFilmData>(`${TMDB.BASE_URL}/movie/${id}?append_to_response=credits`, {
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

const crewRoles: Record<string, PersonRole> = {
  Novel:      'writer',
  Screenplay: 'writer',
  Story:      'writer',
  Director:   'director'
} as const

// Extracts the 'data' type only when 'ok' is true
export type FilmIngestionData = Extract<ReturnType<typeof extractFilmData>, { ok: true }>['data'];

function extractFilmData(film: TmdbFilmData) {
  // Derive release year from string
  const year = parseInt(film.release_date.slice(0, 4))
  if (isNaN(year)) return fail('INVALID_RELEASE')
  if (film.runtime <= 0) return fail('INVALID_RUNTIME')

  // Prepare iterables before transaction
  const genres = film.genres.map(genre => genre.id)
  const people: { id: number, name: string, image: string | null, role: PersonRole, priority: number }[] = []

  // Add the ten most relevant actors, TMDB data is ordered by `order` values
  for (const member of film.credits.cast.slice(0, filmConfig.people.max)) {
    people.push({
      id: member.id, name: member.name, image: member.profile_path ?? null, role: 'actor', priority: member.order
    })
  }

  // Add directors and writers, ignore others
  for (const person of film.credits.crew) {
    const role = crewRoles[person.job]
    if (role === undefined) continue
    people.push({ id: person.id, name: person.name, image: person.profile_path, role, priority: 0 })
  }

  return succeed({
    id:       film.id,
    title:    film.title,
    language: film.original_language,
    year,
    runtime:  film.runtime,
    added:    Date.now(),
    poster:   film.poster_path,
    backdrop: film.backdrop_path,
    overview: film.overview,
    genres,
    people
  })
}
