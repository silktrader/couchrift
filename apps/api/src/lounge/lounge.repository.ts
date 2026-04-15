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

export function deleteActiveLoungeParticipant(requestUserId: string, targetUserId: string, loungeId: string): {
  deletedParticipant: boolean,
  deletedLounge: boolean
} {
  // Wrap queries in a transaction to avoid race conditions between multiple requests.
  return db.transaction(() => {

    // Look for the participant entry and delete it if present.
    // It's impossible to delete participants in ended lounges.
    // Only the lounge creator can kick users from active lounges.
    const participantResult = db.query(`
        DELETE
        FROM lounge_participants
        WHERE participantId = @targetUserId
          AND loungeId = @loungeId
          AND EXISTS (SELECT 1
                      FROM lounges
                      WHERE id = @loungeId
                        AND endedAt IS NULL
                        AND (@requestUserId = @targetUserId OR creatorId = @requestUserId))
    `).run({ requestUserId, targetUserId, loungeId })

    // Return a negative result to be handled by the service
    if (participantResult.changes === 0) return { deletedParticipant: false, deletedLounge: false }

    // Check whether the lounge needs to be deleted; the 'ended_at' null check is redundant but safe
    const loungeResult = db.query(`
        DELETE
        FROM lounges
        WHERE id = @loungeId
          AND endedAt IS NULL
          AND NOT EXISTS (SELECT 1 FROM lounge_participants WHERE loungeId = @loungeId)
    `).run({ loungeId })

    return { deletedParticipant: true, deletedLounge: loungeResult.changes > 0 }
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