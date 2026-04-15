import type { LoungeParticipant } from './primitives.ts'

export type WsLoungeEvent =
  | {
  type: 'user_joined'
  user: LoungeParticipant
}
  | {
  type: 'user_left'
  user: { id: string }
}
  | {
  type: 'lounge_started'
  data: { startedAt: number }
}