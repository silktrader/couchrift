import type {
  LoungeSettings, LoungeCreateResponse, LoungeResponse, LeaveLoungeResponse
} from '@couchrift/shared/schemas/lounge'
import { apiPost, apiDelete } from '$lib/apiFetch'
import { createContext } from 'svelte'

export class LoungeService {
  private _lounge: LoungeResponse
  get lounge(): Readonly<LoungeResponse> {
    return this._lounge
  }

  constructor(lounge: LoungeResponse) {
    this._lounge = $state(lounge)
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