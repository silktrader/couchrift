import type {
  LoungeSettings, LoungeCreateResponse, LoungeResponse, LeaveLoungeResponse
} from '@couchrift/shared/schemas/lounge'
import { apiPost, apiDelete } from '$lib/apiFetch'
import { createContext } from 'svelte'
import { WsClient } from '$lib/wsClient'
import type { WsLoungeEvent } from '@couchrift/shared/schemas/ws-lounge-event.ts'

type LoungeEventMap = { [E in WsLoungeEvent as E['type']]: E }

export class LoungeService {
  private _lounge: LoungeResponse
  get lounge(): Readonly<LoungeResponse> {
    return this._lounge
  }

  private ws: WsClient<LoungeEventMap>

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
    })

    this.ws.on('user_left', (event) => {
      this._lounge = {
        ...this._lounge,
        participants: this._lounge.participants.filter(
          p => p.id !== event.user.id
        )
      }
    })
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

export async function leaveLounge(loungeId: string) {
  return await apiDelete<LeaveLoungeResponse>(`me/lounges/active/${loungeId}`)
}