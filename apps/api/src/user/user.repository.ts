import db from '../db'
import { t } from 'elysia'

export function getUserAvatar(userId: string): string | undefined {
  const avatar = db.query(`
      SELECT image
      FROM users
      WHERE id = @userId`).get({ userId }) as { image: string } | undefined

  return avatar?.image ?? undefined
}

export function setUserAvatar(userId: string, avatar: string): boolean {
  const update = db.query(`
      UPDATE users
      SET image = @avatar
      WHERE id = @userId`).run({ userId, avatar })
  return update.changes > 0
}