import type {
  LoungeSettings, LoungeCreateResponse, LoungeResponse, LeaveLoungeResponse
} from '@couchrift/shared/schemas/lounge'
import { apiPost } from '$lib/apiFetch'
import { createContext } from 'svelte'
import { WsClient } from '$lib/wsClient'
import type { WsLoungeEvent } from '@couchrift/shared/schemas/ws-lounge-event.ts'
import { client } from '$lib/et-api'
import { fail, succeed } from '@couchrift/shared/utilities'
import type { LoungeParticipant } from '@couchrift/shared/schemas/primitives.ts'

type LoungeEventMap = { [E in WsLoungeEvent as E['type']]: E }

// Used to record pages' registered event handlers
type LoungeListener = (event: WsLoungeEvent) => void

export class LoungeService {
  private _lounge: LoungeResponse
  get lounge(): Readonly<LoungeResponse> {
    return this._lounge
  }

  private ws: WsClient<LoungeEventMap>
  private listeners = new Set<LoungeListener>()

  constructor(lounge: LoungeResponse) {
    this._lounge = $state(lounge)
    this.ws = new WsClient(`/ws/lounges/${lounge.id}`)
    this.registerHandlers()
    this.ws.connect()
  }

  destroy() {
    this.ws.disconnect()
  }

  private addParticipant(participant: LoungeParticipant) {
    if (this.lounge.participants.some(p => p.id === participant.id)) return // prevent duplicates from WS events
    this._lounge = {
      ...this._lounge,
      participants: [...this._lounge.participants, participant]
    }
  }

  private removeParticipant(userId: string) {
    this._lounge = {
      ...this._lounge,
      participants: this._lounge.participants.filter(p => p.id !== userId)
    }
  }

  private registerHandlers() {
    this.ws.on('user_joined', (event) => {
      this.addParticipant(event.user)
      this.emit(event)
    })

    this.ws.on('user_left', (event) => {
      this.removeParticipant(event.user.id)
      this.emit(event)
    })

    this.ws.on('user_removed', (event) => {
      this.removeParticipant(event.user.id)
      this.emit(event)
    })

    this.ws.on('lounge_deleted', (event) => {
      this.emit(event)
    })
  }

  // Callers must unsubscribe otherwise listeners will leak.
  onEvent(listener: LoungeListener) {
    this.listeners.add(listener)

    // Return an unsubscriber
    return () => { this.listeners.delete(listener) }
  }

  private emit(event: WsLoungeEvent) {
    for (const listener of [...this.listeners]) listener(event) // avoid mutation during iteration
  }
}

export const [getLoungeContext, setLoungeContext] = createContext<LoungeService>()

export async function createLounge(settings: LoungeSettings):
  Promise<{ ok: true; shortcode: string } | { ok: false; error: string }> {
  const result = await apiPost<LoungeCreateResponse>('lounges', { settings })
  switch (result.type) {
    case 'success':
      return succeed({ shortcode: result.data.shortcode })
    case 'empty':
      return fail('MISSING_DATA')
    default:
      return fail('UNKNOWN')
  }
}

export async function joinLounge(shortcode: string) {
  return await apiPost<{ joined: boolean }>(`lounges/waiting/${shortcode}/participants`)
}

async function removeParticipant(loungeId: string, participantId: string) {
  return await client.api.lounges({ loungeId }).participants({ participantId }).delete()
}

export async function leaveLounge(loungeId: string, participantId: string) {
  const { error } = await removeParticipant(loungeId, participantId)
  if (!error) return succeed()

  switch (error.value.type) {
    case 'validation':
      return fail('Wrong lounge or user ID.')
    case 'PARTICIPANT_NOT_FOUND':
      return fail('Wrong user ID provided.')
    case 'UNAUTHORIZED':
      return fail('You are unauthorized.')
    case 'LOUNGE_NOT_FOUND':
      return fail('Lounge not found.')
    case 'LOUNGE_ENDED':
      return fail('You can\'t leave a lounge that has ended.')
    case 'CREATOR_CANT_LEAVE':
      return fail('You can\'t leave a lounge that you started. Delete it, instead.')
    case 'CANT_KICK_USER':
      return fail('You can\'t kick the user.')
  }
}

export async function kickUser(loungeId: string, participantId: string) {
  const { error } = await removeParticipant(loungeId, participantId)
  if (!error) return succeed()

  switch (error.value.type) {
    case 'validation':
      return fail('Wrong lounge or user ID.')
    case 'PARTICIPANT_NOT_FOUND':
      return fail('Wrong user ID provided.')
    case 'UNAUTHORIZED':
      return fail('You are unauthorized.')
    case 'LOUNGE_NOT_FOUND':
      return fail('Lounge not found.')
    case 'LOUNGE_ENDED':
    case 'CREATOR_CANT_LEAVE':
    case 'CANT_KICK_USER':
      return fail('You can\'t kick the user.')
  }
}

export async function deleteLounge(loungeId: string) {
  const { error } = await client.api.lounges({ loungeId }).delete()
  if (!error) return succeed()

  switch (error.value.type) {
    case 'UNAUTHORIZED':
      return fail('You are unauthorized.')
    case 'NOT_CREATOR':
      return fail('Only lounge creators can delete lounges.')
    case 'LOUNGE_NOT_FOUND':
      return fail('Lounge not found.')
    case 'LOUNGE_ENDED':
      return fail('Lounge ended.')
    case 'validation':
      return fail('Wrong lounge ID.')

  }
}