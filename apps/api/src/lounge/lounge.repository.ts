import db from '../db'
import { AddLoungeData } from './lounge.models'
import { LoungeResponse } from '@couchrift/shared/schemas/lounge'

export function addLounge(data: AddLoungeData) {
  const tx = db.transaction(() => {
    const insertLounge = db.query(`
        INSERT INTO lounge_participants (loungeId, participantId)
        VALUES (@loungeId, @creatorId)`).run({ ...data, settings: JSON.stringify(data.settings) })

    if (insertLounge.changes !== 1) throw new Error('Lounge insertion failed')

    const insertParticipant = db.query(`
        INSERT INTO lounge_participants (loungeId, participantId)
        VALUES (@loungeId, @creatorId)`).run({ loungeId: data.id, creatorId: data.creatorId })

    if (insertParticipant.changes !== 1) throw new Error('Participant insertion failed')
  })

  tx()
}

export function findActiveLoungeByCode(shortcode: string, userId: string): LoungeResponse | null {
  const lounge = db.query<{
    id: string
    creatorId: string
    createdAt: number
    startedAt: number
    settings: string
    participants: string
  }, { shortcode: string, userId: string }>(`
      SELECT l.id,
             l.creatorId,
             l.createdAt,
             l.startedAt,
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
      WHERE l.endedAt IS NULL
        AND l.shortcode = @shortcode
      GROUP BY l.id
      HAVING SUM(lp.participantId = @userId) > 0
  `).get({ shortcode, userId })

  if (!lounge) return null

  return {
    ...lounge,
    shortcode,
    endedAt:      null,
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
