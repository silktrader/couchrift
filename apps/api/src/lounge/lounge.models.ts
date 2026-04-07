export interface AddLoungeData {
  id: string
  creatorId: string
  createdAt: number
  shortcode: string
  settings: {
    maxDuration: number
  }
}