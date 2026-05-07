import { redirect } from '@sveltejs/kit'
import { authClient } from '$lib/auth-client'

// Redirect logged-in users to their home page.
// This one serves as a landing page for unregistered users.
const user = (await authClient.getSession()).data?.user
if (user) throw redirect(302, '/home')
throw redirect(303, '/sign-in')
