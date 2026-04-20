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
// Described at https://developer.themoviedb.org/reference/movie-details
export interface TmdbFilmData {
  id: string
  backdrop_path: string
  original_language: string
  title: string
  overview: string
  poster_path: string
  release_date: string
  runtime: number
  genres: { id: number, name: string }[]
  vote_average: number
}