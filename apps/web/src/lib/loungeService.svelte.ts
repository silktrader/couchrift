import type { LoungeSettings, LoungeCreateResponse, LoungeResponse } from '@couchrift/shared/schemas/lounge'
import { apiPost } from '$lib/apiFetch'
import { createContext } from 'svelte'

export const createLounge = async (
  settings: LoungeSettings
): Promise<{ ok: true; shortcode: string } | { ok: false; error: string }> => {
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