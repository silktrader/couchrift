import type { LoungeParticipant } from './primitives.ts'

export type WsLoungeEvent =
  {
    type: 'user_joined'
    user: LoungeParticipant
  } |
  {
    type: 'user_left'
    user: { id: string, name: string }
  } |
  {
    type: 'user_removed'
    user: { id: string, name: string }
  } |
  {
    type: 'lounge_started'
    data: { startedAt: number }
  }