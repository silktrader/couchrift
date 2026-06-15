export type WsUserEvent =
  | {
  type: 'swipe';
  data: {
    loungeId: string
    swipedAt: number
    like: boolean
    film: {
      id: number
      title: string
      year: number
    }
  }
}
