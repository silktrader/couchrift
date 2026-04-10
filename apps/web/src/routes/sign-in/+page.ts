import { redirect } from '@sveltejs/kit'
import { authClient } from '$lib/auth-client'

export const load = async () => {
  const session = await authClient.getSession()

  if (session.data?.user)
    throw redirect(302, '/')

  return {}
}