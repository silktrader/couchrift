import db from '../db'
import type { AddLoungeData } from './lounge.models'
import type { LoungeResponse } from '@couchrift/shared/schemas/lounge'
import { fail, succeed } from '@couchrift/shared/utilities'
import { runTransactionWithRollback } from '../db/transaction.ts'

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

    // The CASCADE effect should trigger the deletion of at least two rows: lounge and first participant
    if (deleted.changes === 0) throw new Error(`[deleteLounge] DELETE affected 0 rows, expected 2 or more`)

    return succeed()
  })

  return tx.immediate() // write lock is acquired at the start
}

// Looks up lounges, active or otherwise, by their shortcode.
export function findLoungeByCode(shortcode: string, userId: string): LoungeResponse | null {
  const lounge = db.query<{
    id: string
    creatorId: string
    createdAt: number
    startedAt: number
    endedAt: number
    settings: string
    participants: string
  }, { shortcode: string, userId: string }>(`
      SELECT l.id,
             l.creatorId,
             l.createdAt,
             l.startedAt,
             l.endedAt,
             l.settings,
             json_group_array(json_object(
                     'id', u.id,
                     'name', u.name,
                     'image', u.image,
                     'disconnectedAt', lp.disconnectedAt
                              )) AS participants
      FROM lounges l
               LEFT JOIN lounge_participants lp ON lp.loungeId = l.id
               LEFT JOIN users u ON u.id = lp.participantId
      WHERE l.shortcode = @shortcode
      GROUP BY l.id
  `).get({ shortcode, userId })

  if (!lounge) return null

  return {
    ...lounge,
    shortcode,
    settings:     JSON.parse(lounge.settings),
    participants: (JSON.parse(lounge.participants) as []).filter(Boolean)
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

    return succeed({ user: { name: lounge.participantName, id: participantId } })
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
    const lounge = db.query<{ creatorId: string, startedAt: number | null, participants: number }, {
      loungeId: string
    }>(`
        SELECT creatorId, startedAt, count(lp.participantId) as participants
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

    // Attempt to gather random films
    const randomFilms = db.query<{ id: number }, { total: number }>(`
        SELECT id
        FROM films
        ORDER BY random()
        LIMIT @total
    `).all({ total })
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

    return succeed({ startedAt })
  })
}
