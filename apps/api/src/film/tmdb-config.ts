export const TMDB = {
  BASE_URL:              'https://api.themoviedb.org/3',
  API_KEY:               Bun.env.TMDB_API_KEY!,
  TARGET_FILM_COUNT:     5000,
  GENRE_UPDATE_INTERVAL: 8_000_000_000, // circa three months in ms.
  MAX_PAGE:              300      // hard max is 500, stay in quality territory (popular, complete data)
}