import type { PageLoad } from './$types'
import { client } from '$lib/et-api'
import { error as svelteError } from '@sveltejs/kit'

export const load: PageLoad = async () => {
  const { data, error } = await client.api.genres.get()
  if (data) return data
  svelteError(error.status, { message: 'Error fetching genres', type: error.value.type })
}