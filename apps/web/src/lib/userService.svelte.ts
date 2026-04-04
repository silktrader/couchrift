import type { User } from 'better-auth'
import { createContext } from 'svelte'
import { authClient } from '$lib/auth-client'
import { apiUpload } from '$lib/apiFetch'

type SessionStore = ReturnType<typeof authClient.useSession>

export class UserService {
  user = $state<Readonly<User>>(null!)

  constructor(sessionStore: SessionStore) {

    sessionStore.subscribe((session) => {
      if (session.isPending || !session.data?.user) return
      this.user = session.data.user
    })

  }

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)

    const result = await apiUpload<{ fileName: string }>(`users/me/avatar`, formData)

    if (result.type === 'success') {
      this.user = { ...this.user, image: result.data.fileName }
    }

    return result
  }
}

export const [getUserContext, setUserContext] = createContext<UserService>()