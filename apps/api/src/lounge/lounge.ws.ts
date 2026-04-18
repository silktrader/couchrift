import { Elysia, t } from 'elysia'
import { LoungeParticipant, LoungeIdSchema } from '@couchrift/shared/schemas/primitives'
import { betterAuth } from '../lib/auth-plugin'
import { getLoungeParticipant } from './lounge.service'
import { WsLoungeEvent } from '@couchrift/shared/schemas/ws-lounge-event'

type wsConnection = {
  socket: {
    send: (data: string) => void
    readyState: number
  }
  userId: string
}

const lounges = new Map<string, Map<wsConnection['socket'], wsConnection>>()

function addConnection(conn: wsConnection, loungeId: string) {
  let lounge = lounges.get(loungeId)
  if (!lounge) lounges.set(loungeId, (lounge = new Map()))
  lounge.set(conn.socket, conn)
}

function removeConnection(socket: wsConnection['socket'], loungeId: string) {
  const lounge = lounges.get(loungeId)
  if (!lounge) return

  lounge.delete(socket)
  if (lounge.size === 0) lounges.delete(loungeId)
}

// Broadcast helpers called from HTTP handlers

function broadcast(loungeId: string, event: WsLoungeEvent) {
  const lounge = lounges.get(loungeId)
  if (!lounge) return
  const payload = JSON.stringify(event)

  for (const wsSub of lounge.values()) {
    // Prevents crashes when sockets close mid-loop
    if (wsSub.socket.readyState === 1) {
      wsSub.socket.send(payload)
    }
  }
}

export function broadcastUserJoined(loungeId: string, user: LoungeParticipant) {
  broadcast(loungeId, { type: 'user_joined', user })
}

export function broadcastUserLeft(loungeId: string, user: { id: string, name: string }) {
  broadcast(loungeId, { type: 'user_left', user })
}

export function broadcastUserRemoved(loungeId: string, user: { id: string, name: string }) {
  broadcast(loungeId, { type: 'user_removed', user })
}

export function broadcastLoungeRemoved(loungeId: string) {
  broadcast(loungeId, { type: 'lounge_deleted' })
}

export const loungeWsController = new Elysia()
  .use(betterAuth)
  .ws('/ws/lounges/:loungeId', {

    params: t.Object({ loungeId: LoungeIdSchema }),
    auth:   true,

    // Connection opened
    open(ws) {
      // Ensure that the user is part of the lounge
      const participant = getLoungeParticipant(ws.data.user.id, ws.data.params.loungeId)
      if (participant === null) {
        ws.close()
        return
      }

      addConnection({ socket: ws.raw, userId: ws.data.user.id }, ws.data.params.loungeId)
    },

    // Connection closed
    close(ws) {
      removeConnection(ws.raw, ws.data.params.loungeId)
    },

    message(_ws, _message) {
      // Extend here for client-initiated actions if needed.
    }
  })