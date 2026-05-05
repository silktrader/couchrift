import type { TmdbFilm } from '@couchrift/shared/schemas/tmdbFilm.ts'

export interface TmdbGenre {
  id: number
  name: string
}

// Response from https://api.themoviedb.org/3/discover/movie
// Described at https://developer.themoviedb.org/reference/discover-movie
export interface TmdbDiscoverResponse {
  results: TmdbFilmDiscover[]
  page: number
  total_pages: number
  total_results: number
}

export interface TmdbFilmDiscover {
  id: number
  original_language: string
  release_date: string        // "YYYY-MM-DD"
  poster_path: string
  genre_ids: number[]
  vote_average: number
  adult: boolean
}

// Response from https://api.themoviedb.org/3/movie/{movie_id}
// Augmented with "append_to_response" query
// Described at https://developer.themoviedb.org/reference/movie-details
export interface TmdbFilmData {
  id: number
  backdrop_path: string
  original_language: string
  title: string
  overview: string
  poster_path: string
  release_date: string
  runtime: number
  genres: { id: number, name: string }[]
  vote_average: number,
  credits: TmdbCreditsData
}

interface TmdbCreditsData {
  id: number,
  cast: {
    id: number,
    name: string,
    order: number,
    profile_path: string
  }[],
  crew: {
    id: number,
    name: string,
    profile_path: string,
    job: string
  }[]
}

// Returned by DB queries
export type TmdbFilmRow = Omit<TmdbFilm, 'genres'> & { genres: string } & { people: string }