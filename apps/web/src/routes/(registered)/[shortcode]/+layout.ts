import type { LayoutLoad } from './$types'
import { error } from '@sveltejs/kit'
import type { LoungeResponse } from '@couchrift/shared/schemas/lounge'
import { apiGet } from '$lib/apiFetch'

export const load: LayoutLoad = async ({ params, fetch }) => {
  const shortcode = params.shortcode
  const response = await apiGet<LoungeResponse>(`lounges/active/${shortcode}`)
  if (response.type === 'success') {
    return { lounge: response.data }
    // SvelteKit will render the nearest +error.svelte
  }
  throw error(404, 'Lounge not found')
  // redirect to a page that invites to join the lounge depending on error tk
}