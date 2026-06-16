import { redirect } from '@sveltejs/kit'
import { authClient } from '$lib/auth-client'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  const session = await authClient.getSession()

  // Redirect registered users to their dashboard
  if (session.data?.user)
    throw redirect(302, '/home')

  // Redirect unregistered ones to the sign-in page
  throw redirect(303, '/sign-in')
}
