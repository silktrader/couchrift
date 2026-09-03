export interface FriendRequest {
  readonly id: string
  readonly createdAt: number
  readonly sender: {
    readonly id: string,
    readonly name: string,
    readonly image: string | null
  }
}
