export interface AddLoungeData {
  id: string
  creatorId: string
  createdAt: number
  shortcode: string
  settings: {
    maxDuration: number
  }
}

// Used by the "Add Swipe" endpoint.
export interface AddSwipeData {
  loungeId: string,
  userId: string,
  filmId: number,
  like: boolean
}