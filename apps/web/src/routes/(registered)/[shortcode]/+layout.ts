import type { LayoutLoad } from './$types'
import { error as svelteError } from '@sveltejs/kit'
import { client } from '$lib/et-api'

export const load: LayoutLoad = async ({ params }) => {
  const { data, error } = await client.api.lounges.active({ shortcode: params.shortcode }).get()
  if (data) return data
  svelteError(error.status, { message: 'Error fetching user lounges', type: error.value.type })
}