<script lang="ts">
  import type { LayoutProps } from './$types'
  import { setUserContext, UserService } from '$lib/userService.svelte'
  import { authClient } from '$lib/auth-client'
  import { goto } from '$app/navigation'

  let { children }: LayoutProps = $props()

  const session = authClient.useSession()
  const us = setUserContext(new UserService(session))

  let isPending = $state(session.get().isPending)
  session.subscribe((s) => { isPending = s.isPending })

  $effect(() => {
    if (!isPending && !us.user) {
      goto('/sign-in', { replaceState: true })
    }
  })
</script>

{#if isPending}
  Loading ...
{:else if us.user}
  {@render children()}
{/if}
