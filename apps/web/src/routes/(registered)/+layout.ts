import { redirect } from '@sveltejs/kit'
import { authClient } from '$lib/auth-client'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ url }) => {
  const session = await authClient.getSession()
  if (!session.data?.user) {
    // URL-encode the path + query string to preserve it
    throw redirect(307, `/sign-in?redirectTo=${encodeURIComponent(url.pathname + url.search)}`)
  }
}