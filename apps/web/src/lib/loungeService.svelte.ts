import type {
  LoungeSettings, LoungeCreateResponse, LoungeResponse, LeaveLoungeResponse
} from '@couchrift/shared/schemas/lounge'
import { apiPost } from '$lib/apiFetch'
import { createContext } from 'svelte'
import { WsClient } from '$lib/wsClient'
import type { WsLoungeEvent } from '@couchrift/shared/schemas/ws-lounge-event.ts'
import { client } from '$lib/et-api'

type LoungeEventMap = { [E in WsLoungeEvent as E['type']]: E }

// Used to record pages' registered event handlers
type LoungeListener = (event: WsLoungeEvent) => void

export class LoungeService {
  private _lounge: LoungeResponse
  get lounge(): Readonly<LoungeResponse> {
    return this._lounge
  }

  private ws: WsClient<LoungeEventMap>
  private listeners: Array<LoungeListener> = []

  constructor(lounge: LoungeResponse) {
    this._lounge = $state(lounge)
    this.ws = new WsClient(`/ws/lounges/${lounge.id}`)
    this.registerHandlers()
    this.ws.connect()
  }

  destroy() {
    this.ws.disconnect()
  }

  private registerHandlers() {
    this.ws.on('user_joined', (event) => {
      console.log('update')
      this._lounge = {
        ...this._lounge,
        participants: [...this._lounge.participants, event.user]
      }
      this.emit(event)
    })

    this.ws.on('user_left', (event) => {
      this._lounge = {
        ...this._lounge,
        participants: this._lounge.participants.filter(
          p => p.id !== event.user.id
        )
      }
      this.emit(event)
    })
  }

  onEvent(listener: LoungeListener) {
    this.listeners.push(listener)

    // Return an unsubscriber
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit(event: WsLoungeEvent) {
    for (const listener of this.listeners) listener(event)
  }
}

export const [getLoungeContext, setLoungeContext] = createContext<LoungeService>()

export async function createLounge(settings: LoungeSettings):
  Promise<{ ok: true; shortcode: string } | { ok: false; error: string }> {
  const result = await apiPost<LoungeCreateResponse>('lounges', { settings })
  switch (result.type) {
    case 'success':
      return {
        ok:        true,
        shortcode: result.data.shortcode
      }
    case 'empty':
      return { ok: false, error: 'Missing data.' }
    default:
      return { ok: false, error: result.message }
  }
}

export async function joinLounge(shortcode: string) {
  return await apiPost<{ joined: boolean }>(`lounges/waiting/${shortcode}/participants`)
}

export async function leaveLounge(loungeId: string, participantId: string):
  Promise<{ ok: true } | { ok: false, error: string }> {
  const { error } = await client.api.lounges({ loungeId }).participants({ participantId }).delete()

  if (!error) return { ok: true }

  const fail = (message: string) => ({ ok: false, error: message })

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