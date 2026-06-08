import { createContext } from 'svelte'
import { client } from '$lib/et-api'

export class GenreService {
  private _genres = $state<{ id: number; name: string }[]>([])
  private _loadingPromise: Promise<void> | null = null

  get genres() {
    return this._genres
  }

  async load() {
    if (this._genres.length > 0) return
    if (this._loadingPromise) return this._loadingPromise

    this._loadingPromise = (async () => {
      const { data } = await client.api.genres.get()
      if (data) {
        this._genres = data.genres
        // tk handle failure?
      }
    })()

    return this._loadingPromise
  }

  getName(id: number | string) {
    const idNum = Number(id)
    return this._genres.find(g => g.id === idNum)?.name || `Genre ${id}`
  }
}

// Create the context hooks
export const [getGenreContext, setGenreContext] = createContext<GenreService>()