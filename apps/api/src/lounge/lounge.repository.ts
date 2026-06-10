import db from '../db'
import type { AddLoungeData } from './lounge.models'
import { type LoungeResponse, type LoungeSettings, parseLoungeSettings } from '@couchrift/shared/schemas/lounge'
import { fail, succeed } from '@couchrift/shared/utilities'
import { runTransactionWithRollback } from '../db/transaction.ts'
import type { TmdbFilm, FilmPerson } from '@couchrift/shared/schemas/tmdbFilm.ts'
import type { TmdbFilmRow } from '../film/film.models.ts'

export function addLounge(data: AddLoungeData) {
  const tx = db.transaction(() => {
    const insertLounge = db.query(`
        INSERT INTO lounges (id, creatorId, createdAt, shortcode, settings)
        VALUES (@id, @creatorId, @createdAt, @shortcode, @settings)
    `).run({ ...data, settings: JSON.stringify(data.settings) })

    if (insertLounge.changes !== 1) throw new Error('Lounge insertion failed')

    const insertParticipant = db.query(`
        INSERT INTO lounge_participants (loungeId, participantId)
        VALUES (@loungeId, @creatorId)
    `).run({ loungeId: data.id, creatorId: data.creatorId })

    if (insertParticipant.changes !== 1) throw new Error('Participant insertion failed')
  })

  tx()
}

export function setLoungeSettings(loungeId: string, settings: LoungeSettings) {
  return db.query(`
      UPDATE lounges
      SET settings = @settings
      WHERE id = @loungeId
  `).run({ loungeId, settings: JSON.stringify(settings) })
}

export function deleteLounge(loungeId: string, requesterId: string) {
  const tx = db.transaction(() => {
    const lounge = db.query<{ creatorId: string, endedAt: number | null }, { loungeId: string }>(`
        SELECT creatorId, endedAt
        FROM lounges
        WHERE id = @loungeId
    `).get({ loungeId })

    if (!lounge) return fail('LOUNGE_MISSING')
    if (lounge.creatorId !== requesterId) return fail('NOT_CREATOR')
    if (lounge.endedAt !== null) return fail('LOUNGE_ENDED')

    const deleted = db.query(`
        DELETE
        FROM lounges
        WHERE id = @loungeId
          AND endedAt IS NULL
          AND creatorId = @requesterId
    `).run({ loungeId, requesterId })

    // The CASCADE effect triggers the deletion of:
    // - lounge data
    // - participants
    // - swipes
    if (deleted.changes === 0) throw new Error(`[deleteLounge] DELETE affected 0 rows, expected 2 or more`)

    return succeed()
  })

  return tx.immediate() // write lock is acquired at the start
}

// Gets ACTIVE lounge by its code
export function getActiveLoungeByCode(shortcode: string) {
  // Fetch data in one snapshot to avoid out of date participants data
  const lounge = db.query<{
    id: string
    creatorId: string
    createdAt: number
    startedAt: number | null
    settings: string
    participants: string
  }, { shortcode: string }>(`
      SELECT l.id,
             l.creatorId,
             l.createdAt,
             l.startedAt,
             l.settings,
             json_group_array(
                     json_object(
                             'id', u.id,
                             'name', u.name,
                             'image', u.image
                     )) AS participants
      FROM lounges l
               LEFT JOIN lounge_participants lp ON lp.loungeId = l.id
               LEFT JOIN users u ON u.id = lp.participantId
      WHERE l.shortcode = @shortcode
        AND endedAt IS NULL
      GROUP BY l.id
  `).get({ shortcode })

  if (!lounge) return null

  return {
    ...lounge,
    shortcode,
    settings:     JSON.parse(lounge.settings),
    participants: JSON.parse(lounge.participants) as { id: string, name: string, image: string }[]
  }
}

// Returns active lounges the user is part of along with their participants.
export function findActiveUserLounges(userId: string) {
  return db.query<{
    id: string
    creatorId: string
    createdAt: number
    startedAt: number
    shortcode: string
    settings: string
    userId: string
    name: string
    image: string
  }, { userId: string }>(`
      SELECT l.id,
             l.creatorId,
             l.createdAt,
             l.startedAt,
             l.shortcode,
             l.settings,
             u.id as userId,
             u.name,
             u.image
      FROM lounges l
               JOIN lounge_participants lp ON lp.loungeId = l.id
               JOIN users u ON u.id = lp.participantId
      WHERE l.endedAt IS NULL
        AND l.id IN (SELECT loungeId FROM lounge_participants WHERE participantId = @userId)
      ORDER BY l.createdAt DESC, l.id;
  `).all({ userId })
}

export function getUserEndedLounges(userId: string, max: number) {
  return db.query<{ id: string, creatorId: string, endedAt: number }, { userId: string, max: number }>(`
      SELECT id, creatorId, endedAt
      FROM lounge_participants lp
               JOIN lounges l ON lp.loungeId = l.id
      WHERE endedAt IS NOT NULL
        AND lp.participantId = @userId
      LIMIT @max
  `).all({ userId, max })
}

export function getLoungeData(loungeId: string) {
  return db.query<
    { creatorId: string, startedAt: number, endedAt: number, settings: string, participantIds: string[] }, {
    loungeId: string
  }>(`
      SELECT creatorId,
             startedAt,
             endedAt,
             settings,
             json_group_array(u.id) AS participantIds
      FROM lounges l
               LEFT JOIN lounge_participants lp on lp.loungeId = l.id
               LEFT JOIN users u ON u.id = lp.participantId
      WHERE l.id = @loungeId`).get({ loungeId })
}

export function deleteLoungeParticipant(participantId: string, requesterId: string, loungeId: string) {
  return runTransactionWithRollback(() => {
    // Run pre-write checks
    const lounge = db.query<
      {
        creatorId: string,
        endedAt: number | null,
        participantName: string,
        participantIsMember: boolean
      },
      { loungeId: string, participantId: string }
    >(`
        SELECT creatorId, endedAt, u.name AS participantName, (lp.participantId IS NOT NULL) as participantIsMember
        FROM lounges l
                 LEFT JOIN users u ON u.id = @participantId
                 LEFT JOIN lounge_participants lp ON lp.loungeId = l.id AND lp.participantId = u.id
        WHERE l.id = @loungeId
    `).get({ loungeId, participantId })

    if (lounge === null) return fail('LOUNGE_MISSING')
    if (lounge.endedAt !== null) return fail('LOUNGE_ENDED')
    if (lounge.creatorId === participantId) return fail('FORBIDDEN_LEAVE')
    if (!lounge.participantIsMember) return fail('USER_MISSING')
    if (participantId !== requesterId && requesterId !== lounge.creatorId) return fail('FORBIDDEN_KICK')

    // Finally delete the user
    const { changes } = db.query(`
        DELETE
        FROM lounge_participants
        WHERE participantId = @participantId
          AND loungeId = @loungeId
    `).run({ participantId, loungeId })

    // Defensive guard for future code changes
    if (changes === 0) throw new Error(`[deleteLoungeParticipant] DELETE affected 0 rows, expected 1`)

    return succeed({ name: lounge.participantName, id: participantId })
  })
}

export function upsertLoungeParticipant(userId: string, shortcode: string) {
  return db.transaction(() => {
    const lounge = db.query<{ id: string; startedAt: number | null }, { shortcode: string }>(`
        SELECT id, startedAt
        FROM lounges
        WHERE shortcode = @shortcode
    `).get({ shortcode })

    if (!lounge) return { ok: false, error: 'NOT_FOUND' } as const
    if (lounge.startedAt !== null) return { ok: false, error: 'STARTED' } as const

    const insert = db.query(`
        INSERT INTO lounge_participants (loungeId, participantId)
        VALUES (@loungeId, @userId)
        ON CONFLICT (loungeId, participantId) DO UPDATE SET disconnectedAt = NULL
    `).run({ loungeId: lounge.id, userId })

    return { ok: true, loungeId: lounge.id, joined: insert.changes > 0 } as const
  })()
}

export function selectLoungeParticipant(userId: string, loungeId: string) {
  return db.query<{ id: string, name: string, image: string }, { userId: string, loungeId: string }>(`
      SELECT u.id, u.name, u.image
      FROM lounge_participants lp
               JOIN users u ON u.id = lp.participantId
      WHERE loungeId = @loungeId
        AND participantId = @userId
  `).get({ userId, loungeId })
}

export function setLoungeStartWithInitialFilms(loungeId: string, requesterId: string, filmsPerParticipant: number) {
  return runTransactionWithRollback(() => {
    // Perform initial checks WITHIN the transaction to avoid race conditions
    const lounge = db.query<{ creatorId: string, startedAt: number | null, settings: string, participants: number }, {
      loungeId: string
    }>(`
        SELECT creatorId, startedAt, settings, count(lp.participantId) as participants
        FROM lounges
                 LEFT JOIN lounge_participants lp ON lounges.id = lp.loungeId
        WHERE id = @loungeId
    `).get({ loungeId })

    if (!lounge) return fail('LOUNGE_MISSING')
    if (lounge.creatorId !== requesterId) return fail('UNAUTHORISED')
    if (lounge.startedAt !== null) return fail('LOUNGE_STARTED')
    if (lounge.participants < 2) return fail('PARTICIPANTS_MISSING')

    // Determine the number of films to gather
    const total = filmsPerParticipant * lounge.participants

    // Safely parse and validate the settings
    let settings = parseLoungeSettings(lounge.settings)

    // Attempt to gather random films
    const randomFilms = db.query<
      { id: number },
      {
        total: number
        minRuntime: number
        maxRuntime: number
        minReleaseYear: number
        maxReleaseYear: number
        excludedGenresJson: string
      }>(`
        SELECT id
        FROM films
        WHERE runtime >= @minRuntime
          AND runtime <= @maxRuntime
          AND year >= @minReleaseYear
          AND year <= @maxReleaseYear
          AND NOT EXISTS (SELECT 1
                          FROM film_genres
                          WHERE film_genres.film_id = films.id
                            AND film_genres.genre_id IN (SELECT value FROM json_each(@excludedGenresJson)))
        ORDER BY random()
        LIMIT @total
    `).all({
      total,
      minRuntime:         settings.minRuntime,
      maxRuntime:         settings.maxRuntime,
      minReleaseYear:     settings.minReleaseYear,
      maxReleaseYear:     settings.maxReleaseYear,
      excludedGenresJson: JSON.stringify(settings.excludedGenres)
    })

    if (randomFilms.length < total) return fail('FILMS_MISSING')

    // Insert the randomly gathered films into the lounge's pool.
    for (const film of randomFilms)
      db.query(`
          INSERT
          INTO lounge_films (loungeId, filmId)
          VALUES (@loungeId, @filmId)
      `).run({ loungeId, filmId: film.id })

    const startedAt = Date.now()

    // Set the lounge's start
    db.query(`
        UPDATE lounges
        SET startedAt = @startedAt
        WHERE id = @loungeId
    `).run({ startedAt, loungeId })

    return succeed(startedAt)
  })
}

export function selectUnswipedFilms(loungeId: string, userId: string, needed: number): ReadonlyArray<TmdbFilm> {
  const rows = db.query<TmdbFilmRow, { userId: string, loungeId: string, needed: number }>(`
      SELECT films.id,
             title,
             language,
             year,
             runtime,
             poster,
             backdrop,
             overview,
             (SELECT json_group_array(DISTINCT g.name)
              FROM film_genres fg
                       JOIN genres g ON g.id = fg.genre_id
              WHERE fg.film_id = films.id) AS genres,
             (SELECT json_group_array(
                             json_object(
                                     'name', p.name,
                                     'image', p.image,
                                     'role', fp.role,
                                     'priority', fp.priority
                             )
                     )
              FROM film_people fp
                       JOIN people p ON p.id = fp.personId
              WHERE fp.filmId = films.id)  AS people
      FROM lounge_films
               JOIN films ON films.id = lounge_films.filmId
      WHERE loungeId = @loungeId
        AND lounge_films.filmId NOT IN (SELECT filmId
                                        FROM swipes
                                        WHERE loungeId = @loungeId
                                          AND userId = @userId)
      GROUP BY films.id
      ORDER BY random()
      LIMIT @needed
  `).all({ userId, loungeId, needed })

  return rows.map((film) => ({
    ...film,
    genres: JSON.parse(film.genres) as string[],
    people: JSON.parse(film.people) as FilmPerson[]
  }))
}

export function insertSwipe(swipe: { loungeId: string, userId: string, filmId: number, like: boolean }) {

  const { loungeId, userId, filmId } = swipe

  return runTransactionWithRollback(() => {
      // Run preliminary checks and count current film likes.
      const lounge = db.query<{
        creatorId: string,
        startedAt: number | null,
        endedAt: number | null,
        participantsCount: number,
        isParticipant: boolean
      }, {
        loungeId: string, userId: string
      }>(`
          SELECT startedAt,
                 endedAt,
                 (SELECT COUNT(*)
                  FROM lounge_participants
                  WHERE loungeId = lounges.id)         AS participantsCount,
                 EXISTS(SELECT 1
                        FROM lounge_participants
                        WHERE loungeId = lounges.id
                          AND participantId = @userId) AS isParticipant
          FROM lounges
          WHERE id = @loungeId
      `).get({ loungeId, userId })

      if (!lounge) return fail('LOUNGE_MISSING')
      if (!lounge.startedAt) return fail('LOUNGE_UNSTARTED')
      if (lounge.endedAt) return fail('LOUNGE_ENDED')
      if (!lounge.isParticipant) return fail('FORBIDDEN_SWIPE')

      // Set a single timestamp for all operations
      const now = Date.now()

      // Insert the swipe
      const { changes } = db.query(`
          INSERT INTO swipes (loungeId, userId, filmId, swipedAt, value)
          VALUES (@loungeId, @userId, @filmId, @swipedAt, @value)
          ON CONFLICT(loungeId, userId, filmId) DO NOTHING
      `).run({ loungeId, userId, filmId, swipedAt: now, value: swipe.like ? 1 : -1 })

      if (changes !== 1) return fail('ALREADY_SWIPED')

      // Dislikes can't trigger a match; exit early
      if (!swipe.like) return succeed({ match: false })

      // Check for matches
      const { likeCount } = db.query<{ likeCount: number }, { loungeId: string, filmId: number }>(`
          SELECT COUNT(*) AS likeCount
          FROM swipes
          WHERE loungeId = @loungeId
            AND filmId = @filmId
            AND value = 1
      `).get({ loungeId, filmId })! // safe due to previous insertion

      // Detect a non-match
      if (likeCount !== lounge.participantsCount) return succeed({ match: false })

      // Update lounge state and insert match entry
      const updateLounge = db.query(`
          UPDATE lounges
          SET endedAt = @endedAt
          WHERE id = @loungeId
      `).run({ endedAt: now, loungeId })
      if (!updateLounge.changes) throw new Error('Lounge update failed') // defensive guard, should not reach

      const matchInsert = db.query(`
          INSERT INTO lounge_matches (loungeId, filmId, matchedAt)
          VALUES (@loungeId, @filmId, @matchedAt)
      `).run({ loungeId, filmId, matchedAt: now })
      if (!matchInsert.changes) throw new Error('Match insertion failed') // defensive guard, should not reach
      return succeed({ match: true, filmId })
    }
  )
}

export function getEndedLounge(loungeId: string) {
  const lounge = db.query<{
    shortcode: string
    creatorId: string
    createdAt: number
    startedAt: number
    endedAt: number
    settings: string
  }, { loungeId: string }>(`
      SELECT l.shortcode,
             l.creatorId,
             l.createdAt,
             l.startedAt,
             l.endedAt,
             l.settings
      FROM lounges l
      WHERE l.id = @loungeId
        AND endedAt IS NOT NULL
  `).get({ loungeId })

  if (lounge) return {
    ...lounge,
    settings: JSON.parse(lounge.settings)
  }
  return null
}

export function getLoungeParticipants(loungeId: string) {
  return db.query<{
    id: string
    name: string
    image: string | null
    liked: number
    disliked: number
  }, {
    loungeId: string
  }>(`
      SELECT u.id,
             u.name,
             u.image,
             (SELECT COUNT(*)
              FROM swipes
              WHERE loungeId = lp.loungeId
                AND userId = lp.participantId
                AND value = 1)  AS liked,
             (SELECT COUNT(*)
              FROM swipes
              WHERE loungeId = lp.loungeId
                AND userId = lp.participantId
                AND value = -1) AS disliked
      FROM lounge_participants lp
               LEFT JOIN users u ON lp.participantId = u.id
      WHERE lp.loungeId = @loungeId
  `).all({ loungeId })
}

export function getEndedLoungeMatches(loungeId: string) {
  const matches = db.query<TmdbFilmRow & { matchedAt: number }, { loungeId: string }>(`
      SELECT lm.filmId                         AS id,
             title,
             language,
             year,
             runtime,
             poster,
             backdrop,
             overview,
             matchedAt,
             json_group_array(DISTINCT g.name) AS genres,
             (SELECT json_group_array(
                             json_object(
                                     'name', p.name,
                                     'image', p.image,
                                     'role', fp.role,
                                     'priority', fp.priority
                             )
                     )
              FROM film_people fp
                       JOIN people p ON p.id = fp.personId
              WHERE fp.filmId = lm.filmId)     AS people
      FROM lounge_matches lm
               LEFT JOIN films ON films.id = lm.filmId
               LEFT JOIN film_genres AS fg ON fg.film_id = lm.filmId
               LEFT JOIN genres g ON g.id = fg.genre_id
      WHERE lm.loungeId = @loungeId
      GROUP BY lm.filmId, lm.matchedAt
      ORDER BY lm.matchedAt
  `).all({ loungeId })

  // Must expect matches in ended lounges
  if (matches.length === 0) throw new Error('Expected matches but none found.')
  return matches.map(m => ({
    ...m,
    genres: JSON.parse(m.genres) as string[],
    people: JSON.parse(m.people) as FilmPerson[]
  }))
}

