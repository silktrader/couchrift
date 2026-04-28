import type { PageLoad } from './$types'
import { error as svelteError } from '@sveltejs/kit'
import { client } from '$lib/et-api'

export const load: PageLoad = async () => {
  const { data, error } = await client.api.me.lounges.get({ query: { max: 3 } })
  if (data) return data
  svelteError(error.status, { message: 'Error fetching user lounges', type: error.value.type })
}