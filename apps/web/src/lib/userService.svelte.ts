import type {User} from 'better-auth'
import {createContext} from 'svelte'
import {authClient} from '$lib/auth-client'
import {apiUpload} from '$lib/apiFetch'
import {WsClient} from '$lib/wsClient'
import type {WsUserEvent} from '@couchrift/shared/schemas/ws-user-event.ts'
import {client} from "$lib/et-api";
import {fail, succeed} from "@couchrift/shared/utilities";
import type {FriendRequest} from "@couchrift/shared/models/friendRequest.ts";

type SessionStore = ReturnType<typeof authClient.useSession>
type UserEventMap = { [E in WsUserEvent as E['type']]: E }
type UserListener = (event: WsUserEvent) => void

export class UserService {
  user = $state<Readonly<User>>(null!)
  friendRequests = $state<FriendRequest[]>([])

  private ws: WsClient<UserEventMap>
  private listeners = new Set<UserListener>()

  constructor(sessionStore: SessionStore) {

    sessionStore.subscribe((session) => {
      if (session.isPending || !session.data?.user) return
      this.user = session.data.user
      void this.loadFriendRequests()
    })

    // Register event listeners
    this.ws = new WsClient(`/ws/users/me`)
    this.registerHandlers()
    this.ws.connect()
  }

  destroy() {
    this.ws.disconnect()
  }

  private registerHandlers() {

    this.ws.on('swipe', event => {
      this.emit(event)
    })
  }

  // Callers must unsubscribe otherwise listeners will leak.
  onEvent(listener: UserListener) {
    this.listeners.add(listener)

    // Return an unsubscriber
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(event: WsUserEvent) {
    for (const listener of [...this.listeners]) listener(event) // avoid mutation during iteration
  }

  private async loadFriendRequests() {
    const {data, error} = await client.api.users.me.friend_requests.get()

    if (error) {
      console.log("ERROR FETCHING FriendRequests")
      return
    }

    this.friendRequests = data
  }

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)

    const result = await apiUpload<{ fileName: string }>(`users/me/avatar`, formData)

    if (result.type === 'success') {
      this.user = {...this.user, image: result.data.fileName}
    }

    return result
  }

  async requestFriendship(recipientId: string) {
    const {data, error} = await client.api.users({id: recipientId}).friend_requests.post()
    if (error) return fail(error.value.type)
    return succeed(data)
  }

  async declineFriendRequest(requestId: string) {
    const {error} = await client.api.users.me.friend_requests({id: requestId}).delete()
    if (error) return fail(error.value.type)

    // update friend requests store
    this.friendRequests = this.friendRequests.filter(r => r.id !== requestId)
    return succeed()
  }
}

export const [getUserContext, setUserContext] = createContext<UserService>()