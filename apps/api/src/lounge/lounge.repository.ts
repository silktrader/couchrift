import db from '../db'
import { AddLoungeData } from './lounge.models'

const insertLounge = db.prepare(`
    INSERT INTO lounges (id, creator_id, created_at, shortcode, settings)
    VALUES (@id, @creatorId, @createdAt, @shortcode, @settings)
`)

const insertParticipant = db.prepare(`
    INSERT INTO lounge_participants (lounge_id, participant_id)
    VALUES (@loungeId, @creatorId)`)

export function addLounge(data: AddLoungeData) {
  const tx = db.transaction(() => {
    const loungeResult = insertLounge.run({ ...data, settings: JSON.stringify(data.settings) })
    if (loungeResult.changes !== 1)
      throw new Error('Lounge insertion failed')

    const participantResult = insertParticipant.run({ loungeId: data.id, creatorId: data.creatorId })
    if (participantResult.changes !== 1)
      throw new Error('Participant insertion failed')
  })

  tx()
}