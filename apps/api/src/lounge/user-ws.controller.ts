import { Elysia } from 'elysia'
import { betterAuth } from '../lib/auth-plugin'
import type { WsUserEvent } from '@couchrift/shared/schemas/ws-user-event'

type WsSocket = {
  send: (data: string) => void
  readyState: number
}

// One userId → many sockets (multiple tabs)
const userConnections = new Map<string, Set<WsSocket>>()

function addUserConnection(userId: string, socket: WsSocket) {
  userConnections
    .getOrInsert(userId, new Set())  // per SPECS: prefer getOrInsert with Map
    .add(socket)
}

function removeUserConnection(userId: string, socket: WsSocket) {
  const sockets = userConnections.get(userId)
  if (!sockets) return
  sockets.delete(socket)
  if (sockets.size === 0) userConnections.delete(userId)
}

function broadcastToUser(userId: string, event: WsUserEvent) {
  const sockets = userConnections.get(userId)
  if (!sockets) return
  const payload = JSON.stringify(event)
  for (const socket of sockets) {
    if (socket.readyState === 1) socket.send(payload)
  }
}

export function notifyUserSwipe(
  userId: string,
  loungeId: string,
  swipedAt: number,
  like: boolean,
  film: {
    id: number,
    title: string,
    year: number
  }
) {
  broadcastToUser(userId, { type: 'swipe', data: { loungeId, swipedAt, like, film } })
}

export const userWsController = new Elysia()
  .use(betterAuth)
  .ws('/ws/users/me', {
    auth: true,
    open(ws) {
      addUserConnection(ws.data.user.id, ws.raw)
    },
    close(ws) {
      removeUserConnection(ws.data.user.id, ws.raw)
    },
    message() {
      // Server-push only for now
    }
  })