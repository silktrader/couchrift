<script lang="ts">
  import type { LayoutProps } from './$types'
  import { setUserContext, UserService } from '$lib/userService.svelte'
  import { setGenreContext, GenreService } from '$lib/genreService.svelte'
  import { authClient } from '$lib/auth-client'

  let { children }: LayoutProps = $props()

  const session = authClient.useSession()
  const us = setUserContext(new UserService(session))
  const gs = setGenreContext(new GenreService())

  let isPending = $state(session.get().isPending)
  session.subscribe((s) => { isPending = s.isPending })

  // Pre-fetch genres immediately on client mount
  $effect(() => {
    gs.load()
  })

  // Clean up web socket connections on navigating away
  $effect(() => {
    return () => us.destroy()
  })
</script>

{#if isPending}
  Loading ...
{:else if us.user}
  {@render children()}
{/if}
