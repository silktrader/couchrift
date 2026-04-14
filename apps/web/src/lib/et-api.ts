import { treaty } from '@elysiajs/eden'
import type { App } from '@couchrift/api'   // workspace import

export const client = treaty<App>(window.location.origin, {
  fetch: { credentials: 'include' }
})