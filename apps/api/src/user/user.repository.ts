import db from '../db'
import {fail, succeed} from "@couchrift/shared/utilities";

export function userExists(userId: string) {
  const user = db.query(`
      SELECT 1
      FROM users
      WHERE id = @userId
  `).get({userId})
  return !!user
}

export function getUserAvatar(userId: string): string | undefined {
  const avatar = db.query(`
      SELECT image
      FROM users
      WHERE id = @userId`).get({userId}) as { image: string } | undefined

  return avatar?.image ?? undefined
}

export function setUserAvatar(userId: string, avatar: string): boolean {
  const update = db.query(`
      UPDATE users
      SET image = @avatar
      WHERE id = @userId`).run({userId, avatar})
  return update.changes > 0
}

export function getUserDetails(userId: string) {
  return db.query<{ name: string, image: string, createdAt: number }, { userId: string }>(`
      SELECT name, image, createdAt
      FROM users
      WHERE id = @userId
  `).get({userId})
}

export function selectFriendRequestWithTarget(userId: string, targetId: string) {
  return db.query<{ id: string, createdAt: number }, { userId: string, targetId: string }>(`
      SELECT id, createdAt
      FROM friend_requests
      WHERE requesterId = @userId
        AND recipientId = @targetId
  `).get({userId, targetId})
}

export function selectFriendship(firstUser: string, secondUser: string) {
  return db.query<{ befriendedAt: number }, { firstUser: string, secondUser: string }>(`
      SELECT befriendedAt
      FROM friendships
      WHERE userIdA = MIN(@firstUser, @secondUser)
        AND userIdB = MAX(@firstUser, @secondUser)
  `).get({firstUser, secondUser})
}

export function insertFriendRequest(requesterId: string, recipientId: string) {
  const now = Date.now()
  const id = Bun.randomUUIDv7()
  db.query(`
      INSERT INTO friend_requests (id, requesterId, recipientId, createdAt)
      VALUES (@id, @requesterId, @recipientId, @now)
      ON CONFLICT (requesterId, recipientId) DO NOTHING;
  `).run({id, requesterId, recipientId, now})
  return succeed({id, createdAt: now})
}

export function selectUserFriendRequests(userId: string) {
  return db.query<
    { id: string, requesterId: string, createdAt: number, name: string, image: string },
    { userId: string }>(`
      SELECT reqs.id, reqs.requesterId, reqs.createdAt, senders.name, senders.image
      FROM friend_requests reqs
               LEFT JOIN users senders ON requesterId = senders.id
      WHERE recipientId = @userId
  `).all({userId})
}

// export function insertFriendship(userIdA: string, userIdB: string, befriendedAt: number) {
//
//   const inserted = db.query(`
//       INSERT INTO friendships (userIdA, userIdB, befriendedAt)
//       VALUES (@userIdA, @userIdB, @befriendedAt)`).run({userIdA, userIdB, befriendedAt})
//
//   return succeed()
// }