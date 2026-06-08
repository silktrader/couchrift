<script lang="ts">
  import { untrack } from 'svelte'
  import { LoungeService, setLoungeContext } from '$lib/loungeService.svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import MatchNotification from './components/match-notification.svelte'
  import { getUserContext } from '$lib/userService.svelte'

  let { children, data } = $props()

  const ls = setLoungeContext(untrack(() => new LoungeService(data.lounge)))
  const us = getUserContext()

  const loungeWaiting = $derived(ls.lounge.startedAt === null)
  const pageWaiting = $derived(page.url.pathname.startsWith(`/${ls.lounge.shortcode}/waiting`))

  let showMatch = $state(false)
  let isCreator = $derived(ls.lounge.creatorId === us.user.id)

  // Clean up web socket connections on navigating away
  $effect(() => {
    return () => ls.destroy()
  })

  // Redirect users when they attempt to access a lounge whose state doesn't match the URL
  $effect(() => {
    if (loungeWaiting && !pageWaiting) {
      goto(`/${ls.lounge.shortcode}/waiting`, { replaceState: true })
    } else if (!loungeWaiting && pageWaiting) {
      goto(`/${ls.lounge.shortcode}`, { replaceState: true })
    }
  })

  $effect(() => {
    return ls.onEvent((event) => {
      switch (event.type) {

        // Valid while "waiting"
        case 'lounge_started':
          goto(`/${ls.lounge.shortcode}`)
          return

        // Valid while "waiting"
        case 'user_removed':
          if (event.user.id === us.user.id) {
            toast.warning(`You were removed from lounge #${ls.lounge.shortcode}.`)
            goto('/home')
          } else {
            toast.info(`${event.user.name} was removed from the lounge.`)
          }
          return

        // Valid while "waiting"
        case 'user_left':
          if (event.user.id !== us.user.id)
            toast.info(`${event.user.name} left the lounge.`)
          return

        case 'user_joined':
          if (event.user.id !== us.user.id)
            toast.info(`${event.user.name} joined the lounge.`)
          return

        case 'lounge_matched':
          showMatch = true
          return

        case 'lounge_deleted':
          if (!isCreator) {
            toast.warning(`Lounge #${ls.lounge.shortcode} deleted. You were redirected to your home page.`)
          }
          goto('/home')
          return

        case 'lounge_settings_updated':
          if (!isCreator)
            toast.info('Lounge settings updated.')
          return
      }
    })
  })
</script>

<!-- Render elements only when the URL matches the lounge's state -->
{#if showMatch}
  <MatchNotification/>
{:else if (loungeWaiting && pageWaiting)}
  {@render children()}
{:else if (!loungeWaiting && !pageWaiting)}
  {@render children()}
{/if}

