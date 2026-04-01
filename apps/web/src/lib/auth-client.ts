import { createAuthClient } from 'better-auth/svelte'

export const authClient = createAuthClient({
  // If the auth server is running on the same domain as the client, baseURL can be omitted
  // https://www.better-auth.com/docs/concepts/client
  //baseURL: 'http:/localhost:3000' // The base URL of the auth server, beware the proxy in vite.config.ts
})