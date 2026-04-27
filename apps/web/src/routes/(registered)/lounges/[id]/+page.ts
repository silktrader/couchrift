import { error as svelteError } from '@sveltejs/kit'
import { client } from '$lib/et-api'

export const load = async ({ params }) => {

  const { data, error } = await client.api.lounges.ended({ id: params.id }).get()

  if (data) return data
  svelteError(error.status, { message: '', type: error.value.type })

}