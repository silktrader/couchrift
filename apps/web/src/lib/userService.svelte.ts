import type { User } from 'better-auth'
import { createContext } from 'svelte'
import { authClient } from '$lib/auth-client'

type SessionStore = ReturnType<typeof authClient.useSession>

export class UserService {
  user = $state<Readonly<User>>(null!)

  constructor(sessionStore: SessionStore) {

    sessionStore.subscribe((session) => {
      if (session.isPending || !session.data?.user) return
      this.user = session.data.user
    })

  }
}

export const [getUserContext, setUserContext] = createContext<UserService>()