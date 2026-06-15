import type {
  LoungeSettings, LoungeCreateResponse, LoungeResponse, LeaveLoungeResponse
} from '@couchrift/shared/schemas/lounge'
import { apiPost } from '$lib/apiFetch'
import { createContext } from 'svelte'
import { WsClient } from '$lib/wsClient'
import type { WsLoungeEvent } from '@couchrift/shared/schemas/ws-lounge-event.ts'
import { client } from '$lib/et-api'
import { fail, succeed } from '@couchrift/shared/utilities'
import type { LoungeParticipant } from '@couchrift/shared/schemas/primitives.ts'
import type { TmdbFilm } from '@couchrift/shared/schemas/tmdbFilm.ts'
import { filmConfig } from '@couchrift/shared/config/film.ts'
import type { Swipe } from '@couchrift/shared/schemas/swipes.ts'

type LoungeEventMap = { [E in WsLoungeEvent as E['type']]: E }

// Used to record pages' registered event handlers
type LoungeListener = (event: WsLoungeEvent) => void

export const defaultSettings: LoungeSettings = {
  minRuntime:     filmConfig.runtime.min,
  maxRuntime:     filmConfig.runtime.max,
  minReleaseYear: filmConfig.year.min,
  maxReleaseYear: new Date().getFullYear(),
  excludedGenres: []
}

export class LoungeService {
  private _lounge: LoungeResponse
  get lounge(): Readonly<LoungeResponse> {
    return this._lounge
  }

  // Queue of films
  private _films: TmdbFilm[] = $state([])
  get films() { return this._films }

  private _match: TmdbFilm | null = $state(null)
  get match() { return this._match }

  private ws: WsClient<LoungeEventMap>
  private listeners = new Set<LoungeListener>()

  constructor(lounge: LoungeResponse) {
    this._lounge = $state(lounge)
    this.ws = new WsClient(`/ws/lounges/${lounge.id}`)
    this.registerHandlers()
    this.ws.connect()
  }

  destroy() {
    this.ws.disconnect()
  }

  private addParticipant(participant: LoungeParticipant) {
    if (this.lounge.participants.some(p => p.id === participant.id)) return // prevent duplicates from WS events
    this._lounge = {
      ...this._lounge,
      participants: [...this._lounge.participants, participant]
    }
  }

  private removeParticipant(userId: string) {
    this._lounge = {
      ...this._lounge,
      participants: this._lounge.participants.filter(p => p.id !== userId)
    }
  }

  // Get the films IDs the user hasn't swiped through.
  public async queueLoungeFilms() {
    const { data, error } = await client.api.lounges({ loungeId: this.lounge.id }).films.unswiped.me.get()
    if (error) return fail(error.value.type)

    // API should guarantee uniqueness so this is merely defensive
    const existingIds = new Set(this._films.map(f => f.id))
    for (const film of data.unswipedFilms) {
      if (!existingIds.has(film.id))
        this._films.push(film) // adds elements to the end
    }

    return succeed()
  }

  // Send swipe requests
  public async sendSwipe(value: -1 | 1) {
    const filmId = this._films.at(0)?.id
    if (!filmId) return fail('FILM_MISSING')
    const { error } = await client.api.lounges({ loungeId: this.lounge.id })
                                  .swipes
                                  .post({ filmId, like: value === 1 })

    if (error) return fail(error.value.type)

    // Delay removing the film from the queue so that the UI can perform animations
    return succeed()
  }

  public dequeueFilm() {
    this._films.shift()
  }

  private registerHandlers() {
    this.ws.on('user_joined', event => {
      this.addParticipant(event.user)
      this.emit(event)
    })

    this.ws.on('user_left', event => {
      this.removeParticipant(event.user.id)
      this.emit(event)
    })

    this.ws.on('user_removed', event => {
      this.removeParticipant(event.user.id)
      this.emit(event)
    })

    this.ws.on('lounge_started', event => {
      this._lounge.startedAt = event.data.startedAt
      this.emit(event)
    })

    this.ws.on('lounge_deleted', event => {
      this.emit(event)
    })

    this.ws.on('lounge_matched', event => {
      this._match = event.match
      this.emit(event)
    })

    this.ws.on('lounge_settings_updated', event => {
      this._lounge.settings = event.data.settings
      this.emit(event)
    })
  }

  // Callers must unsubscribe otherwise listeners will leak.
  onEvent(listener: LoungeListener) {
    this.listeners.add(listener)

    // Return an unsubscriber
    return () => { this.listeners.delete(listener) }
  }

  private emit(event: WsLoungeEvent) {
    for (const listener of [...this.listeners]) listener(event) // avoid mutation during iteration
  }
}

export const [getLoungeContext, setLoungeContext] = createContext<LoungeService>()

export async function createLounge(settings: LoungeSettings) {
  const { data, error } = await client.api.lounges.post({ settings })
  if (data) return succeed({ shortcode: data.shortcode })
  switch (error.status) {
    case 401:
      return fail('AUTHORIZATION_ERROR')
    case 422:
      return fail('VALIDATION_ERROR')
    default:
      return fail('UNKNOWN_ERROR')
  }
}

export async function joinLounge(shortcode: string) {
  return await apiPost<{ joined: boolean }>(`lounges/waiting/${shortcode}/participants`)
}

async function removeParticipant(loungeId: string, participantId: string) {
  return await client.api.lounges({ loungeId }).participants({ participantId }).delete()
}

const COMMON_MESSAGES = {
  validation:     'Malformed query or request body.',
  UNAUTHORIZED:   'You are unauthorised.',
  LOUNGE_MISSING: 'Lounge not found.',
  USER_MISSING:   'User not found.',
  FORBIDDEN_KICK: 'You can\'t kick the user.'
} as const

export async function leaveLounge(loungeId: string, participantId: string) {
  const { error } = await removeParticipant(loungeId, participantId)
  if (!error) return succeed()

  switch (error.value.type) {
    case 'LOUNGE_ENDED':
      return fail('You can\'t leave a lounge that has ended.')
    case 'FORBIDDEN_LEAVE':
      return fail('You can\'t leave a lounge that you started. You can delete it.')
    default:
      return fail(COMMON_MESSAGES[error.value.type])
  }
}

export async function kickUser(loungeId: string, participantId: string) {
  const { error } = await removeParticipant(loungeId, participantId)
  if (!error) return succeed()

  switch (error.value.type) {
    case 'LOUNGE_ENDED':
      return fail('You can\'t kick a user from a lounge that has ended.')
    case 'FORBIDDEN_LEAVE':
      return fail('You can\'t kick the user.')
    default:
      return fail(COMMON_MESSAGES[error.value.type])
  }
}

export async function deleteLounge(loungeId: string) {
  const { error } = await client.api.lounges({ loungeId }).delete()
  if (!error) return succeed()

  switch (error.value.type) {
    case 'NOT_CREATOR':
      return fail('Only lounge creators can delete lounges.')
    default:
      return fail(COMMON_MESSAGES[error.value.type])
  }
}

export async function startLounge(loungeId: string) {
  const { error } = await client.api.lounges({ loungeId }).start.post()
  if (!error) return succeed()

  switch (error.value.type) {
    case 'UNAUTHORISED':
      return fail('You aren\'t the lounge creator.')
    case 'LOUNGE_STARTED':
      return fail('The lounge already started.')
    case 'PARTICIPANTS_MISSING':
      return fail('There must be at least two lounge participants for the lounge to start.')
    case 'FILMS_MISSING':
      return fail('There aren\'t enough films to start the lounge. Try again, in ten minutes.')
    default:
      return fail(COMMON_MESSAGES[error.value.type])
  }
}

export async function updateSettings(loungeId: string, settings: LoungeSettings) {
  const { error } = await client.api.lounges({ loungeId }).settings.put(settings)
  if (!error) return succeed()

  switch (error.value.type) {
    case 'UNAUTHORIZED':
      return fail('Authorisation error.')
    case 'LOUNGE_MISSING':
      return fail('Lounge not found.')
    case 'FORBIDDEN_ACCESS':
      return fail('You cannot change the lounge settings.')
    case 'LOUNGE_STARTED':
      return fail('The lounge already started.')
    case 'validation':
      return fail('Invalid settings provided.')
  }
}