import db from '../db'
import { AddLoungeData } from './lounge.models'
import { LoungeResponse } from '@couchrift/shared/schemas/lounge'

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

export function deleteActiveLoungeParticipant(participantId: string, requesterId: string, loungeId: string) {
  // Wrap queries in a transaction to avoid race conditions between multiple requests.
  return db.transaction(() => {

    // Perform checks:
    // - lounge exists
    // - lounge hasn't ended
    // - target user isn't the creator

    const lounge = db.query<{ creatorId: string, endedAt: number | null }, { loungeId: string }>(`
        SELECT creatorId, endedAt
        FROM lounges
        WHERE id = @loungeId
    `).get({ loungeId })

    if (lounge === null) return { ok: false, error: 'LOUNGE_NOT_FOUND' } as const
    if (lounge.endedAt !== null) return { ok: false, error: 'LOUNGE_ENDED' } as const
    if (lounge.creatorId === participantId) return { ok: false, error: 'CREATOR_CANT_LEAVE' } as const
    if (participantId !== requesterId && requesterId !== lounge.creatorId)
      return { ok: false, error: 'CANT_KICK_USER' } as const

    // Look for the participant entry and delete it if present.
    const { changes } = db.query(`
        DELETE
        FROM lounge_participants
        WHERE participantId = @participantId
          AND loungeId = @loungeId
    `).run({ participantId, loungeId })

    // Return a negative result to be handled by the service
    if (changes === 0) return { ok: false, error: 'PARTICIPANT_NOT_FOUND' } as const

    return { ok: true } as const
  })()
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